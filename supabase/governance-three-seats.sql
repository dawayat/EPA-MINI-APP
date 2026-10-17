-- Three-seat ballots and temporary voting-only members. Existing votes and account IDs are retained.
begin;
alter table public.members add column if not exists registration_required boolean not null default false;
alter table public.members add column if not exists registration_submitted_at timestamptz;
alter table public.members add column if not exists voting_access_until timestamptz;
alter table public.applications add column if not exists provisional_member_id text references public.members(id);
alter table public.governance_polls add column if not exists seats integer not null default 3 check(seats between 1 and 3);
update public.governance_polls set seats=1 where kind='articles';
alter table public.governance_votes add column if not exists choices text[];
update public.governance_votes set choices=array[choice] where choices is null;
create or replace function public.governance_action(p_actor text,p_admin boolean,p_operation text,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare p public.governance_polls; m public.members; c public.governance_candidates; next_phase text; result_id uuid; selections text[];
begin
 if p_admin and p_operation='create' then
  if p_payload->>'kind' not in ('articles','election') or coalesce(length(trim(p_payload->>'title')),0) not between 1 and 180 then raise exception 'Invalid ballot details'; end if;
  if p_payload->>'kind'='election' and coalesce(length(trim(p_payload->>'position')),0) not between 1 and 100 then raise exception 'Position is required'; end if;
  insert into governance_polls(title,kind,position,article_number,eligible_types,seats)
  values(trim(p_payload->>'title'),p_payload->>'kind',left(p_payload->>'position',100),(p_payload->>'articleNumber')::integer,
    array['FULL'],case when p_payload->>'kind'='election' then 3 else 1 end) returning id into result_id;
  insert into governance_audit(poll_id,actor,operation) values(result_id,p_actor,'created');
  return jsonb_build_object('id',result_id);
 end if;
 select * into p from governance_polls where id=(p_payload->>'pollId')::uuid for update;
 if not found then raise exception 'Ballot not found'; end if;
 if p_admin then
  if p_operation='phase' then
   next_phase:=p_payload->>'phase';
   if next_phase not in ('draft','nominations','voting','closed') or (p.kind='articles' and next_phase='nominations') then raise exception 'Invalid ballot phase'; end if;
   if next_phase in ('draft','nominations') and exists(select 1 from governance_votes where poll_id=p.id) then raise exception 'Voting has already started; close this ballot and create a new one for new nominations'; end if;
   if next_phase='voting' and p.kind='election' and not exists(select 1 from governance_candidates gc join members gm on gm.id=gc.member_id where gc.poll_id=p.id and gc.approved and gm.status::text='ACTIVE' and gm.membership_type::text=any(p.eligible_types)) then raise exception 'Approve at least one eligible candidate before opening the election'; end if;
   if next_phase='voting' and p.kind='articles' and not exists(select 1 from bylaws_settings where id='articles' and enabled) then raise exception 'Activate the articles before opening their vote'; end if;
   update governance_polls set phase=next_phase,updated_at=now() where id=p.id;
  elsif p_operation='approve' then
   if p.kind<>'election' or p.phase not in ('draft','nominations') then raise exception 'Candidate changes are closed'; end if;
   update governance_candidates set approved=(p_payload->>'approved')::boolean where id=(p_payload->>'candidateId')::uuid and poll_id=p.id;
   if not found then raise exception 'Candidate not found'; end if;
  else raise exception 'Invalid admin operation'; end if;
  insert into governance_audit(poll_id,actor,operation,details) values(p.id,p_actor,p_operation,p_payload);
  return jsonb_build_object('success',true);
 end if;
 select * into m from members where id=p_actor for share;
 if not found or m.status::text<>'ACTIVE' or not(m.membership_type::text=any(p.eligible_types)) then raise exception 'Only eligible active members can participate'; end if;
 if m.registration_required and (m.voting_access_until is null or m.voting_access_until<=now()) then raise exception 'Temporary voting access has ended. Complete normal registration'; end if;
 if p.kind='articles' and (not exists(select 1 from bylaws_settings where id='articles' and enabled) or exists(select 1 from bylaws_access where member_id=p_actor and restricted)) then raise exception 'Articles access is unavailable'; end if;
 if p_operation='nominate' then
  if m.registration_required then raise exception 'Complete normal registration before nominating yourself'; end if;
  if p.kind<>'election' or p.phase<>'nominations' then raise exception 'Nominations are closed'; end if;
  if coalesce(length(trim(p_payload->>'manifesto')),0) not between 20 and 2000 then raise exception 'Your statement must contain 20 to 2000 characters'; end if;
  insert into governance_candidates(poll_id,member_id,manifesto) values(p.id,p_actor,trim(p_payload->>'manifesto'))
  on conflict(poll_id,member_id) do update set manifesto=excluded.manifesto,approved=false;
 elsif p_operation='vote' then
  if p.phase<>'voting' then raise exception 'Voting is closed'; end if;
  if p.kind='articles' then
   if coalesce(p_payload->>'choice','') not in ('approve','reject','abstain') then raise exception 'Invalid vote'; end if;
   selections:=array[p_payload->>'choice'];
  else
   if jsonb_typeof(p_payload->'choices')<>'array' or p_payload->'choices' is null then raise exception 'Select between one and three candidates'; end if;
   select array_agg(value) into selections from jsonb_array_elements_text(p_payload->'choices');
   if coalesce(cardinality(selections),0)<1 or cardinality(selections)>p.seats or cardinality(selections)<>(select count(distinct value) from unnest(selections) value) then raise exception 'Choose up to three different candidates'; end if;
   if (select count(*) from governance_candidates gc join members gm on gm.id=gc.member_id where gc.poll_id=p.id and gc.id::text=any(selections) and gc.approved and gm.status::text='ACTIVE' and gm.membership_type::text='FULL' and not gm.registration_required)<>cardinality(selections) then raise exception 'One or more selected candidates are unavailable'; end if;
  end if;
  insert into governance_votes(poll_id,member_id,choice,choices) values(p.id,p_actor,selections[1],selections) on conflict do nothing;
  if not found then raise exception 'You have already voted on this ballot'; end if;
 else raise exception 'Invalid member operation'; end if;
 insert into governance_audit(poll_id,actor,operation) values(p.id,p_actor,p_operation);
 return jsonb_build_object('success',true);
end $$;
revoke all on function public.governance_action(text,boolean,text,jsonb) from public,anon,authenticated;
grant execute on function public.governance_action(text,boolean,text,jsonb) to service_role;

create or replace function public.temporary_member_create(p_name text,p_email text,p_password_hash text,p_admin text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare mid text; mnumber text; deadline timestamptz:=now()+interval '7 days';
begin
 if length(trim(p_name)) not between 3 and 160 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or p_password_hash !~ '^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$' then raise exception 'Invalid temporary member details'; end if;
 perform pg_advisory_xact_lock(hashtextextended(lower(p_email),0));
 if exists(select 1 from members where lower(email)=lower(p_email)) then raise exception 'An account with this email already exists'; end if;
 mid:='mem-'||gen_random_uuid()::text; mnumber:='VOTE-'||upper(substr(gen_random_uuid()::text,1,8));
 insert into members(id,membership_number,verification_token,first_name,father_name,email,phone_password,membership_type,status,is_verified,must_change_password,onboarding_completed,registration_required,voting_access_until,issued_at,expires_at)
 values(mid,mnumber,gen_random_uuid()::text,split_part(trim(p_name),' ',1),substr(trim(p_name),strpos(trim(p_name),' ')+1),lower(p_email),p_password_hash,'FULL','ACTIVE',false,false,false,true,deadline,now(),deadline);
 insert into governance_audit(actor,operation,details) values(p_admin,'temporary_member_created',jsonb_build_object('memberId',mid));
 return jsonb_build_object('success',true,'id',mid,'membershipNumber',mnumber,'votingAccessUntil',deadline);
end $$;
revoke all on function public.temporary_member_create(text,text,text,text) from public,anon,authenticated;
grant execute on function public.temporary_member_create(text,text,text,text) to service_role;
commit;
