-- Permite corregir un registro de uso ya guardado (fecha, doctora, precio,
-- nota de insumos y, solo para el dueño, el honorario). No existían
-- policies de UPDATE en registros_uso/honorarios a propósito — todas las
-- escrituras pasan por funciones SECURITY DEFINER vetadas, igual que
-- registrar_procedimiento y borrar_registro_uso. El honorario se protege
-- adentro de la función, no con una policy, porque la función ya corre con
-- permisos de servidor.
create or replace function actualizar_registro_uso(
  p_registro_uso_id uuid,
  p_fecha timestamptz,
  p_doctora_id uuid,
  p_precio_cobrado numeric,
  p_insumos_texto text,
  p_honorario_monto numeric default null
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
      insumos_texto_historico = p_insumos_texto
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
