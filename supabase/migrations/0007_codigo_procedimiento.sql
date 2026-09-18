-- Código interno del procedimiento (viene del Excel de la clínica, ej. "CON01",
-- "C01"). Sirve para diferenciar procedimientos que comparten el mismo nombre
-- pero son variantes distintas (precios/paquetes distintos).
alter table tipos_procedimiento add column codigo text;
