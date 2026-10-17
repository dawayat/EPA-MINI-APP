begin;
create table if not exists public.governance_comments (
 id uuid primary key default gen_random_uuid(),
 poll_id uuid not null references public.governance_polls(id),
 member_id text not null references public.members(id),
 content text not null check(length(trim(content)) between 1 and 2000),
 created_at timestamptz not null default now()
);
create index if not exists governance_comments_poll_created on public.governance_comments(poll_id,created_at);
alter table public.governance_comments enable row level security;
revoke all on public.governance_comments from public,anon,authenticated;
grant select,insert on public.governance_comments to service_role;
create or replace function public.governance_comment(p_actor text,p_poll_id uuid,p_content text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare p public.governance_polls; m public.members; result_id uuid;
begin
 select * into p from governance_polls where id=p_poll_id for update;
 if not found or p.kind<>'articles' or p.archived_at is not null or p.phase<>'voting' then raise exception 'Comments are open only during the articles vote'; end if;
 select * into m from members where id=p_actor for share;
 if not found or m.status::text<>'ACTIVE' or m.membership_type::text<>'FULL' then raise exception 'Only active full professional members can comment'; end if;
 if m.registration_required and (m.voting_access_until is null or m.voting_access_until<=now()) then raise exception 'Temporary voting access has ended'; end if;
 if not exists(select 1 from bylaws_settings where id='articles' and enabled) or exists(select 1 from bylaws_access where member_id=p_actor and restricted) then raise exception 'Articles access is unavailable'; end if;
 if coalesce(length(trim(p_content)),0) not between 1 and 2000 then raise exception 'Comments must contain 1 to 2,000 characters'; end if;
 if exists(select 1 from governance_comments where poll_id=p.id and member_id=p_actor and created_at>now()-interval '30 seconds') then raise exception 'Please wait 30 seconds before adding another comment'; end if;
 insert into governance_comments(poll_id,member_id,content) values(p.id,p_actor,trim(p_content)) returning id into result_id;
 insert into governance_audit(poll_id,actor,operation) values(p.id,p_actor,'comment');
 return jsonb_build_object('id',result_id);
end $$;
revoke all on function public.governance_comment(text,uuid,text) from public,anon,authenticated;
grant execute on function public.governance_comment(text,uuid,text) to service_role;
notify pgrst,'reload schema';
commit;
