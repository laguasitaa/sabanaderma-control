-- Hasta ahora solo guardábamos el stock actual (el que se va descontando).
-- Para poder mostrar "cuánto había originalmente vs. cuánto queda", se
-- necesita guardar la cantidad comprada por separado, que nunca cambia.
alter table insumos add column stock_inicial numeric not null default 0 check (stock_inicial >= 0);

-- Backfill para insumos que ya existían antes de este cambio: como no hay
-- forma de saber cuánto se compró originalmente, se asume que el stock
-- actual ES el original (aproximación única, solo para datos previos a
-- esta migración).
update insumos set stock_inicial = stock where stock_inicial = 0;
