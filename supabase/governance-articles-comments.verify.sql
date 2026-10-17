begin;
do $$
declare mid text; pid uuid; caught boolean;
begin
 select id into mid from members where status::text='ACTIVE' and membership_type::text='FULL' and not registration_required limit 1;
 -- Closed fixtures avoid the unique active-articles ballot constraint; all changes roll back.
 insert into governance_polls(title,kind,phase,eligible_types) values('Comment verification','articles','closed',array['FULL']) returning id into pid;
 caught:=false;begin perform governance_comment(mid,pid,'Closed comment');exception when raise_exception then caught:=true;end;
 if not caught then raise exception 'Closed comments accepted';end if;
 -- Temporarily close other articles ballots within this rollback-only transaction.
 update governance_polls set phase='closed' where kind='articles' and phase<>'closed';
 update governance_polls set phase='voting' where id=pid;
 update bylaws_settings set enabled=false where id='articles';
 caught:=false;begin perform governance_comment(mid,pid,'Hidden comment');exception when raise_exception then caught:=true;end;
 if not caught then raise exception 'Hidden articles allowed comments';end if;
 update bylaws_settings set enabled=true where id='articles';
 if exists(select 1 from bylaws_access where member_id=mid and restricted) then update bylaws_access set restricted=false where member_id=mid;end if;
 perform governance_comment(mid,pid,'A verification comment, rolled back.');
 if not exists(select 1 from governance_comments where poll_id=pid and member_id=mid) then raise exception 'Comment missing';end if;
 caught:=false;begin perform governance_comment(mid,pid,'Too soon');exception when raise_exception then caught:=true;end;
 if not caught then raise exception 'Rate limit missing';end if;
 if has_table_privilege('anon','public.governance_comments','select') or has_function_privilege('authenticated','public.governance_comment(text,uuid,text)','execute') then raise exception 'Public comment access exposed';end if;
end $$;
rollback;
select 'PASS: comments persist, closed/hidden ballots denied, rate limiting, server-only permissions; all test changes rolled back' as verification, enabled as articles_enabled from bylaws_settings where id='articles';
