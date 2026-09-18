-- Los pacientes importados del histórico no fueron creados por ningún
-- usuario de la app.
alter table pacientes alter column created_by drop not null;
