-- Soporte para importar el histórico real de pacientes (17,902 filas desde
-- 2021). El Excel identifica pacientes por cédula, no por teléfono — así
-- que se permite paciente sin teléfono si tiene documento. Los registros
-- importados se marcan explícitamente (importado_historico) para no
-- confundirlos con registros hechos desde la app, y guardan el texto
-- original cuando el procedimiento o los insumos no empatan limpio con el
-- catálogo — nunca se inventa ni se descarta esa información.

alter table pacientes add column documento text;
alter table pacientes alter column telefono drop not null;

alter table registros_uso add column importado_historico boolean not null default false;
alter table registros_uso alter column created_by drop not null;
alter table registros_uso alter column tipo_procedimiento_id drop not null;
alter table registros_uso add column procedimiento_texto_historico text;
alter table registros_uso add column insumos_texto_historico text;
