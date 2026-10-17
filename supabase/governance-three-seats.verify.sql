-- Every test row is rolled back. Existing members are only read.
begin;
do $$
declare mids text[]; pid uuid; cids text[]; mid text; cid uuid; tid text; caught boolean; created jsonb;
begin
 select array_agg(id) into mids from (select id from members where status::text='ACTIVE' and membership_type::text='FULL' and not registration_required limit 4) m;
 if cardinality(mids)<4 then raise exception 'Four active full members are required for candidate validation'; end if;
 pid:=(governance_action('verification',true,'create','{"kind":"election","title":"Three-seat transactional verification","position":"Executive committee"}')->>'id')::uuid;
 if (select seats from governance_polls where id=pid)<>3 then raise exception 'Incorrect seat count'; end if;
 perform governance_action('verification',true,'phase',jsonb_build_object('pollId',pid,'phase','nominations'));
 foreach mid in array mids loop
  perform governance_action(mid,false,'nominate',jsonb_build_object('pollId',pid,'manifesto','A verification statement which will be rolled back.'));
  select id into cid from governance_candidates where poll_id=pid and member_id=mid;
  perform governance_action('verification',true,'approve',jsonb_build_object('pollId',pid,'candidateId',cid,'approved',true));
  cids:=array_append(cids,cid::text);
 end loop;
 created:=temporary_member_create('Verification Temporary Member','qa-'||gen_random_uuid()::text||'@example.invalid','scrypt$'||repeat('0',32)||'$'||repeat('0',128),'verification');tid:=created->>'id';
 if not (select registration_required and not is_verified and voting_access_until>now() from members where id=tid) then raise exception 'Temporary account was incorrectly promoted'; end if;
 caught:=false;begin perform governance_action(tid,false,'nominate',jsonb_build_object('pollId',pid,'manifesto','A temporary account must not be allowed to nominate.'));exception when raise_exception then caught:=true;end;
 if not caught then raise exception 'Temporary self-nomination accepted';end if;
 perform governance_action('verification',true,'phase',jsonb_build_object('pollId',pid,'phase','voting'));
 caught:=false;begin perform governance_action(tid,false,'vote',jsonb_build_object('pollId',pid,'acknowledgePublicVoters',true,'choices',to_jsonb(cids)));exception when raise_exception then caught:=true;end;
 if not caught then raise exception 'Four selections accepted';end if;
 caught:=false;begin perform governance_action(tid,false,'vote',jsonb_build_object('pollId',pid,'acknowledgePublicVoters',true,'choices',jsonb_build_array(cids[1],cids[1])));exception when raise_exception then caught:=true;end;
 if not caught then raise exception 'Repeated candidate accepted';end if;
 caught:=false;begin perform governance_action(tid,false,'vote',jsonb_build_object('pollId',pid,'choices',to_jsonb(cids[1:3])));exception when raise_exception then caught:=true;end;
 if not caught then raise exception 'Transparent ballot accepted without disclosure acknowledgement';end if;
 perform governance_action(tid,false,'vote',jsonb_build_object('pollId',pid,'acknowledgePublicVoters',true,'choices',to_jsonb(cids[1:3])));
 if (select cardinality(choices) from governance_votes where poll_id=pid and member_id=tid)<>3 then raise exception 'Three choices were not saved';end if;
 caught:=false;begin perform governance_action(tid,false,'vote',jsonb_build_object('pollId',pid,'acknowledgePublicVoters',true,'choices',to_jsonb(cids[1:2])));exception when raise_exception then caught:=true;end;
 if not caught then raise exception 'Duplicate ballot accepted';end if;
 update members set voting_access_until=now()-interval '1 minute' where id=tid;
 caught:=false;begin perform governance_action(tid,false,'vote',jsonb_build_object('pollId',pid,'acknowledgePublicVoters',true,'choices',jsonb_build_array(cids[1])));exception when raise_exception then if sqlerrm not like '%access has ended%' then raise;end if;caught:=true;end;
 if not caught then raise exception 'Expired temporary access accepted';end if;
 perform governance_action('verification',true,'archive',jsonb_build_object('pollId',pid));
 if not exists(select 1 from governance_polls where id=pid and archived_at is not null and phase='closed') then raise exception 'Archive failed';end if;
 perform governance_action('verification',true,'restore',jsonb_build_object('pollId',pid));
 if not exists(select 1 from governance_polls where id=pid and archived_at is null and phase='closed') then raise exception 'Restore reopened or lost the ballot';end if;
 if has_function_privilege('anon','public.temporary_member_create(text,text,text,text)','execute') then raise exception 'Public temporary account creation is exposed';end if;
end $$;
select 'PASS: three selections, max limit, duplicate prevention, scoped temporary account, expiry and RPC permissions' as verification;
rollback;
