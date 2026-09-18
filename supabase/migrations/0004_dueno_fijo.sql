-- Antes, el rol "dueno" lo obtenía automáticamente quien se registrara
-- primero — cualquiera. Eso es frágil: si alguien más se registra antes que
-- el dueño real, se queda con el rol equivocado. Ahora el rol dueño se fija
-- por lista de correos autorizados, no por orden de registro.
create table duenos_autorizados (
  email text primary key
);

-- Sin policies: nadie accede a esta tabla desde la API (ni dueño ni
-- personal). Solo la lee la función de abajo, que corre con permisos de
-- servidor (SECURITY DEFINER) y evita el RLS.
alter table duenos_autorizados enable row level security;

insert into duenos_autorizados (email) values ('paortega202@gmail.com');

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select case
    when exists (select 1 from duenos_autorizados where email = new.email) then 'dueno'
    else 'personal'
  end into v_role;

  insert into profiles (id, nombre, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', new.email), v_role);

  return new;
end;
$$;
