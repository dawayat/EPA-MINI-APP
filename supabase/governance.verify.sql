-- Read-only outcomes; all test ballots, nominations, votes and audit rows roll back.
begin;
do $$
declare mid text; pid uuid; cid uuid; caught boolean;
begin
 select id into mid from members where status::text='ACTIVE' and membership_type::text='FULL' limit 1;
 if mid is null then raise exception 'An active full member is needed for verification'; end if;
 pid := (governance_action('verification',true,'create','{"kind":"election","title":"Transactional verification","position":"Test"}') ->> 'id')::uuid;
 caught:=false;
 begin perform governance_action(mid,false,'vote',jsonb_build_object('pollId',pid,'choice','approve')); exception when raise_exception then caught:=true; end;
 if not caught then raise exception 'Closed voting was accepted'; end if;
 perform governance_action('verification',true,'phase',jsonb_build_object('pollId',pid,'phase','nominations'));
 perform governance_action(mid,false,'nominate',jsonb_build_object('pollId',pid,'manifesto','Verification nomination that will be rolled back.'));
 select id into cid from governance_candidates where poll_id=pid;
 perform governance_action('verification',true,'approve',jsonb_build_object('pollId',pid,'candidateId',cid,'approved',true));
 perform governance_action('verification',true,'phase',jsonb_build_object('pollId',pid,'phase','voting'));
 caught:=false;
 begin perform governance_action(mid,false,'nominate',jsonb_build_object('pollId',pid,'manifesto','A nomination during voting must be rejected.')); exception when raise_exception then caught:=true; end;
 if not caught then raise exception 'Late nomination was accepted'; end if;
 perform governance_action(mid,false,'vote',jsonb_build_object('pollId',pid,'choice',cid));
 caught:=false;
 begin perform governance_action(mid,false,'vote',jsonb_build_object('pollId',pid,'choice',cid)); exception when raise_exception then caught:=true; end;
 if not caught then raise exception 'Duplicate ballot was accepted'; end if;
 if (select count(*) from governance_votes where poll_id=pid)<>1 then raise exception 'Incorrect ballot count'; end if;
 caught:=false;
 begin perform governance_action('verification',true,'phase',jsonb_build_object('pollId',pid,'phase','nominations')); exception when raise_exception then caught:=true; end;
 if not caught then raise exception 'Nominations reopened after voting'; end if;
 perform governance_action('verification',true,'phase',jsonb_build_object('pollId',pid,'phase','closed'));
 if has_function_privilege('anon','public.governance_action(text,boolean,text,jsonb)','execute') or has_function_privilege('authenticated','public.governance_action(text,boolean,text,jsonb)','execute') then raise exception 'Public RPC access detected'; end if;
 if has_table_privilege('anon','public.governance_votes','select') or has_table_privilege('authenticated','public.governance_votes','insert') then raise exception 'Public vote table access detected'; end if;
end $$;
select 'PASS: closed voting, nomination window, approval, final vote, duplicate protection, lifecycle and role grants' as verification;
rollback;
