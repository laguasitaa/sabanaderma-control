-- Costo de compra por insumo. Es dato de dinero (igual que el honorario),
-- así que vive en su propia tabla con policy "solo dueño" — no en la tabla
-- de insumos, que el personal también lee.
create table insumos_costos (
  insumo_id uuid primary key references insumos(id) on delete cascade,
  costo_unitario numeric not null check (costo_unitario >= 0),
  updated_at timestamptz not null default now()
);

alter table insumos_costos enable row level security;

create policy "solo dueno lee costos de insumos"
  on insumos_costos for select
  using (is_owner());

create policy "solo dueno administra costos de insumos"
  on insumos_costos for all
  using (is_owner())
  with check (is_owner());
