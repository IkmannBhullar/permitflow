-- Comment activity now records the name of the permit/project/task commented on, so feeds
-- can say "commented on permit Electrical: ..." instead of an anonymous "the permit".

create or replace function public.comments_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project_id uuid;
  v_name text;
begin
  case new.entity_type
    when 'project' then
      select id, name into v_project_id, v_name from public.projects where id = new.entity_id;
    when 'permit' then
      select project_id, name into v_project_id, v_name from public.permits where id = new.entity_id;
    when 'task' then
      select project_id, title into v_project_id, v_name from public.tasks where id = new.entity_id;
    else
      null;
  end case;
  perform public.log_activity(new.org_id, v_project_id, new.entity_type, new.entity_id, 'commented',
    jsonb_build_object('comment_id', new.id, 'excerpt', left(new.body, 140), 'name', v_name));
  return new;
end;
$$;
