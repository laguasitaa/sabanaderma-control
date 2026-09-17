-- sabanaderma-control — esquema inicial del MVP
-- Modelo: una sola clínica compartida. El dueño y el personal ven pacientes,
-- procedimientos e insumos por igual. Honorarios y tarifas quedan en tablas
-- separadas, visibles solo para el rol "dueno".

-- ============================================================
-- 1. Perfiles (rol de cada usuario autenticado)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  role text not null check (role in ('dueno', 'personal')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Función auxiliar: ¿el usuario actual es dueño?
-- SECURITY DEFINER para poder leer profiles sin recursión de RLS.
create or replace function is_owner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'dueno'
  );
$$;

create policy "cualquier usuario autenticado ve su propio perfil"
  on profiles for select
  using (auth.uid() is not null);

create policy "el usuario crea su propio perfil"
  on profiles for insert
  with check (auth.uid() = id);

-- ============================================================
-- 2. Pacientes (compartidos por toda la clínica)
-- ============================================================
create table pacientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text not null,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create index pacientes_nombre_telefono_idx on pacientes (nombre, telefono);

alter table pacientes enable row level security;

create policy "staff autenticado lee pacientes"
  on pacientes for select
  using (auth.uid() is not null);

create policy "staff autenticado crea pacientes"
  on pacientes for insert
  with check (auth.uid() is not null);

-- ============================================================
-- 3. Insumos (catálogo + stock, compartido)
-- ============================================================
create table insumos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  unidad_medida text not null, -- ej. 'ml', 'g', 'unidad'
  stock numeric not null default 0 check (stock >= 0),
  created_at timestamptz not null default now()
);

alter table insumos enable row level security;

create policy "staff autenticado lee insumos"
  on insumos for select
  using (auth.uid() is not null);

create policy "staff autenticado administra insumos"
  on insumos for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ============================================================
-- 4. Tipos de procedimiento (catálogo)
-- ============================================================
create table tipos_procedimiento (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  precio numeric not null check (precio >= 0), -- lo que se cobra al paciente (visible a staff)
  created_at timestamptz not null default now()
);

alter table tipos_procedimiento enable row level security;

create policy "staff autenticado lee tipos de procedimiento"
  on tipos_procedimiento for select
  using (auth.uid() is not null);

create policy "staff autenticado administra tipos de procedimiento"
  on tipos_procedimiento for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Tarifa de honorario por tipo de procedimiento — SOLO dueño la ve.
create table tipos_procedimiento_honorarios (
  tipo_procedimiento_id uuid primary key references tipos_procedimiento(id) on delete cascade,
  tarifa numeric not null check (tarifa >= 0)
);

alter table tipos_procedimiento_honorarios enable row level security;

create policy "solo dueno lee tarifas de honorario"
  on tipos_procedimiento_honorarios for select
  using (is_owner());

create policy "solo dueno administra tarifas de honorario"
  on tipos_procedimiento_honorarios for all
  using (is_owner())
  with check (is_owner());

-- ============================================================
-- 5. Registros de uso (paciente + procedimiento, compartido)
-- ============================================================
create table registros_uso (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references pacientes(id),
  tipo_procedimiento_id uuid not null references tipos_procedimiento(id),
  precio_cobrado numeric not null, -- congela el precio del momento, no se recalcula si cambia la tarifa
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

alter table registros_uso enable row level security;

create policy "staff autenticado lee registros de uso"
  on registros_uso for select
  using (auth.uid() is not null);

-- Los inserts/updates/deletes de registros_uso pasan SIEMPRE por las
-- funciones RPC de abajo (no por insert/update/delete directo), porque
-- ahí es donde se maneja la transacción de inventario + honorario.
-- No se otorgan policies de insert/update/delete directas a nivel de tabla
-- más allá de lo que las funciones SECURITY DEFINER permiten internamente.

-- Insumos usados en cada registro (cantidad parcial: ml, g, etc.)
create table registros_uso_insumos (
  id uuid primary key default gen_random_uuid(),
  registro_uso_id uuid not null references registros_uso(id) on delete cascade,
  insumo_id uuid not null references insumos(id),
  cantidad numeric not null check (cantidad > 0)
);

alter table registros_uso_insumos enable row level security;

create policy "staff autenticado lee insumos usados"
  on registros_uso_insumos for select
  using (auth.uid() is not null);

-- Honorario calculado por registro — SOLO dueño lo ve.
create table honorarios (
  id uuid primary key default gen_random_uuid(),
  registro_uso_id uuid not null unique references registros_uso(id) on delete cascade,
  monto numeric not null,
  created_at timestamptz not null default now()
);

alter table honorarios enable row level security;

create policy "solo dueno lee honorarios"
  on honorarios for select
  using (is_owner());

-- ============================================================
-- 6. Función transaccional: registrar procedimiento
-- ============================================================
-- Hace todo en una sola transacción (las funciones de Postgres son
-- atómicas): bloquea las filas de insumo con FOR UPDATE, valida stock
-- suficiente (bloquea el registro si no alcanza), descuenta inventario,
-- crea el registro de uso, y calcula el honorario. Dos usuarios
-- registrando el mismo insumo al mismo tiempo quedan serializados por
-- el bloqueo de fila — no hay condición de carrera.
create or replace function registrar_procedimiento(
  p_paciente_id uuid,
  p_tipo_procedimiento_id uuid,
  p_precio_cobrado numeric,
  p_insumos jsonb -- [{"insumo_id": "...", "cantidad": 1.5}, ...]
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

  -- Bloquea cada fila de insumo involucrada, en orden estable (por id)
  -- para evitar deadlocks entre transacciones concurrentes.
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

  -- Ya se validó que hay stock para todos los insumos — descuenta.
  insert into registros_uso (paciente_id, tipo_procedimiento_id, precio_cobrado, created_by)
  values (p_paciente_id, p_tipo_procedimiento_id, p_precio_cobrado, auth.uid())
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

-- ============================================================
-- 7. Función transaccional: borrar un registro (revierte todo)
-- ============================================================
create or replace function borrar_registro_uso(p_registro_uso_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
begin
  if auth.uid() is null then
    raise exception 'no autenticado';
  end if;

  for v_item in
    select insumo_id, cantidad from registros_uso_insumos
    where registro_uso_id = p_registro_uso_id
    order by insumo_id
  loop
    update insumos set stock = stock + v_item.cantidad where id = v_item.insumo_id;
  end loop;

  delete from registros_uso where id = p_registro_uso_id;
  -- honorarios y registros_uso_insumos se borran por ON DELETE CASCADE.
end;
$$;
