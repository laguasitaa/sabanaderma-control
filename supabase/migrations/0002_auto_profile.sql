-- Crea el perfil automáticamente cuando alguien se registra.
-- El primer usuario de la clínica es "dueno"; todos los que siguen son
-- "personal" por default. Nadie puede auto-asignarse el rol dueño desde
-- el formulario de registro — la decisión vive en el servidor.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select case when exists (select 1 from profiles) then 'personal' else 'dueno' end
  into v_role;

  insert into profiles (id, nombre, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', new.email), v_role);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
