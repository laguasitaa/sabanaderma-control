-- Doctoras que hacen procedimientos. No es dato de dinero, así que sigue el
-- mismo patrón de acceso que insumos/tipos_procedimiento: todo el personal
-- autenticado puede leer y administrar.
create table doctoras (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

alter table doctoras enable row level security;

create policy "staff autenticado lee doctoras"
  on doctoras for select
  using (auth.uid() is not null);

create policy "staff autenticado administra doctoras"
  on doctoras for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Qué doctora hizo cada procedimiento. Nullable porque los registros que ya
-- existían antes de este cambio no tienen ese dato.
alter table registros_uso add column doctora_id uuid references doctoras(id);

-- La función que registra el procedimiento ahora también recibe la doctora.
create or replace function registrar_procedimiento(
  p_paciente_id uuid,
  p_tipo_procedimiento_id uuid,
  p_precio_cobrado numeric,
  p_insumos jsonb,
  p_doctora_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registro_id uuid;
  v_tarifa numeric;
  v_item jsonb;
  v_insumo_id uuid;
  v_cantidad numeric;
  v_stock_actual numeric;
begin
  if auth.uid() is null then
    raise exception 'no autenticado';
  end if;

  for v_item in
    select * from jsonb_array_elements(p_insumos) order by (value->>'insumo_id')
  loop
    v_insumo_id := (v_item->>'insumo_id')::uuid;
    v_cantidad := (v_item->>'cantidad')::numeric;

    select stock into v_stock_actual
    from insumos
    where id = v_insumo_id
    for update;

    if v_stock_actual is null then
      raise exception 'insumo % no existe', v_insumo_id;
    end if;

    if v_stock_actual < v_cantidad then
      raise exception 'stock insuficiente para el insumo %: disponible %, pedido %',
        v_insumo_id, v_stock_actual, v_cantidad;
    end if;
  end loop;

  insert into registros_uso (paciente_id, tipo_procedimiento_id, precio_cobrado, created_by, doctora_id)
  values (p_paciente_id, p_tipo_procedimiento_id, p_precio_cobrado, auth.uid(), p_doctora_id)
  returning id into v_registro_id;

  for v_item in select * from jsonb_array_elements(p_insumos)
  loop
    v_insumo_id := (v_item->>'insumo_id')::uuid;
    v_cantidad := (v_item->>'cantidad')::numeric;

    update insumos set stock = stock - v_cantidad where id = v_insumo_id;

    insert into registros_uso_insumos (registro_uso_id, insumo_id, cantidad)
    values (v_registro_id, v_insumo_id, v_cantidad);
  end loop;

  select tarifa into v_tarifa
  from tipos_procedimiento_honorarios
  where tipo_procedimiento_id = p_tipo_procedimiento_id;

  insert into honorarios (registro_uso_id, monto)
  values (v_registro_id, coalesce(v_tarifa, 0));

  return v_registro_id;
end;
$$;

-- Doctoras reales extraídas del histórico (limpiando espacios y un error de
-- dedo: "MICHELLE BEHZAPDOUR" era "MICHELLE BEHZADPOUR" mal escrito).
insert into doctoras (nombre) values
  ('CAMILA RAMIREZ'),
  ('JOHANNA VILLAMIL'),
  ('NATALY OROZCO'),
  ('NATALIA CASTAÑEDA'),
  ('LESLY SOLORZANO'),
  ('MICHELLE BEHZADPOUR'),
  ('DANIELA ZARATE'),
  ('SANTIAGO LOZADA');
