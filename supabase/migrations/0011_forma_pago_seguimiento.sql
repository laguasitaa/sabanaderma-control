-- Forma de pago (para que contaduría concilie caja) y nota de seguimiento
-- clínico por registro. Ambos nullable — no todo procedimiento tiene una
-- nota de seguimiento, y los registros históricos ya importados no
-- siempre traían forma de pago clara.
alter table registros_uso add column forma_pago text;
alter table registros_uso add column nota_seguimiento text;

create or replace function registrar_procedimiento(
  p_paciente_id uuid,
  p_tipo_procedimiento_id uuid,
  p_precio_cobrado numeric,
  p_insumos jsonb,
  p_doctora_id uuid default null,
  p_forma_pago text default null,
  p_nota_seguimiento text default null
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

  insert into registros_uso
    (paciente_id, tipo_procedimiento_id, precio_cobrado, created_by, doctora_id, forma_pago, nota_seguimiento)
  values
    (p_paciente_id, p_tipo_procedimiento_id, p_precio_cobrado, auth.uid(), p_doctora_id, p_forma_pago, p_nota_seguimiento)
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

-- La función de edición también aprende a actualizar estos dos campos.
create or replace function actualizar_registro_uso(
  p_registro_uso_id uuid,
  p_fecha timestamptz,
  p_doctora_id uuid,
  p_precio_cobrado numeric,
  p_insumos_texto text,
  p_honorario_monto numeric default null,
  p_forma_pago text default null,
  p_nota_seguimiento text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'no autenticado';
  end if;

  update registros_uso
  set created_at = p_fecha,
      doctora_id = p_doctora_id,
      precio_cobrado = p_precio_cobrado,
      insumos_texto_historico = p_insumos_texto,
      forma_pago = p_forma_pago,
      nota_seguimiento = p_nota_seguimiento
  where id = p_registro_uso_id;

  if p_honorario_monto is not null then
    if not is_owner() then
      raise exception 'solo el dueño puede editar el honorario';
    end if;

    update honorarios set monto = p_honorario_monto where registro_uso_id = p_registro_uso_id;
    if not found then
      insert into honorarios (registro_uso_id, monto) values (p_registro_uso_id, p_honorario_monto);
    end if;
  end if;
end;
$$;
