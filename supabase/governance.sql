-- Server-only governance data. Apply to EPA project cnwkuzihcmtenpoliqpn.
begin;
create table if not exists public.governance_polls (
 id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 1 and 180),
 kind text not null check(kind in ('articles','election')), position text,
 article_number integer check(article_number between 1 and 31),
 phase text not null default 'draft' check(phase in ('draft','nominations','voting','closed')),
 eligible_types text[] not null default array['FULL'],
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(kind='election' or phase<>'nominations')
);
create unique index if not exists governance_one_articles_ballot on public.governance_polls(kind) where kind='articles' and phase<>'closed';
create table if not exists public.governance_candidates (
 id uuid primary key default gen_random_uuid(), poll_id uuid not null references public.governance_polls(id),
 member_id text not null references public.members(id), manifesto text not null check(length(manifesto) between 20 and 2000),
 approved boolean not null default false, created_at timestamptz not null default now(), unique(poll_id,member_id)
);
create table if not exists public.governance_votes (
 poll_id uuid not null references public.governance_polls(id), member_id text not null references public.members(id),
 choice text not null, created_at timestamptz not null default now(), primary key(poll_id,member_id)
);
create table if not exists public.governance_audit (
 id uuid primary key default gen_random_uuid(), poll_id uuid references public.governance_polls(id),
 actor text not null, operation text not null, details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
alter table public.governance_polls enable row level security;
alter table public.governance_candidates enable row level security;
alter table public.governance_votes enable row level security;
alter table public.governance_audit enable row level security;
revoke all on public.governance_polls,public.governance_candidates,public.governance_votes,public.governance_audit from public,anon,authenticated;
grant select,insert,update on public.governance_polls,public.governance_candidates,public.governance_votes,public.governance_audit to service_role;
create or replace function public.governance_action(p_actor text,p_admin boolean,p_operation text,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare p public.governance_polls; m public.members; c public.governance_candidates; next_phase text; result_id uuid;
begin
 if p_admin and p_operation='create' then
  if p_payload->>'kind' not in ('articles','election') or coalesce(length(trim(p_payload->>'title')),0) not between 1 and 180 then raise exception 'Invalid ballot details'; end if;
  if p_payload->>'kind'='election' and coalesce(length(trim(p_payload->>'position')),0) not between 1 and 100 then raise exception 'Position is required'; end if;
  insert into governance_polls(title,kind,position,article_number,eligible_types)
  values(trim(p_payload->>'title'),p_payload->>'kind',left(p_payload->>'position',100),(p_payload->>'articleNumber')::integer,
    array['FULL']) returning id into result_id;
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
 if p.kind='articles' and (not exists(select 1 from bylaws_settings where id='articles' and enabled) or exists(select 1 from bylaws_access where member_id=p_actor and restricted)) then raise exception 'Articles access is unavailable'; end if;
 if p_operation='nominate' then
  if p.kind<>'election' or p.phase<>'nominations' then raise exception 'Nominations are closed'; end if;
  if coalesce(length(trim(p_payload->>'manifesto')),0) not between 20 and 2000 then raise exception 'Your statement must contain 20 to 2000 characters'; end if;
  insert into governance_candidates(poll_id,member_id,manifesto) values(p.id,p_actor,trim(p_payload->>'manifesto'))
  on conflict(poll_id,member_id) do update set manifesto=excluded.manifesto,approved=false;
 elsif p_operation='vote' then
  if p.phase<>'voting' then raise exception 'Voting is closed'; end if;
  if p.kind='articles' then
   if p_payload->>'choice' not in ('approve','reject','abstain') then raise exception 'Invalid vote'; end if;
  else
   select * into c from governance_candidates where poll_id=p.id and id::text=p_payload->>'choice' and approved;
   if not found or not exists(select 1 from members where id=c.member_id and status::text='ACTIVE' and membership_type::text=any(p.eligible_types)) then raise exception 'Candidate is unavailable'; end if;
  end if;
  insert into governance_votes(poll_id,member_id,choice) values(p.id,p_actor,p_payload->>'choice') on conflict do nothing;
  if not found then raise exception 'You have already voted on this ballot'; end if;
 else raise exception 'Invalid member operation'; end if;
 insert into governance_audit(poll_id,actor,operation) values(p.id,p_actor,p_operation);
 return jsonb_build_object('success',true);
end $$;
revoke all on function public.governance_action(text,boolean,text,jsonb) from public,anon,authenticated;
grant execute on function public.governance_action(text,boolean,text,jsonb) to service_role;
with prepared as (
 insert into public.governance_polls(title,kind)
 select 'Articles of Association · Approval','articles'
 where not exists(select 1 from public.governance_polls where kind='articles')
 on conflict do nothing returning id
)
insert into public.governance_audit(poll_id,actor,operation)
select id,'system','prepared' from prepared;
commit;



