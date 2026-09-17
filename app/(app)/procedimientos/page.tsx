import { Stethoscope } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPerfilActual } from "@/lib/data/perfil";
import { NuevoProcedimientoForm } from "./nuevo-procedimiento-form";

export default async function ProcedimientosPage() {
  const supabase = await createClient();
  const perfil = await getPerfilActual();
  const esDueno = perfil?.role === "dueno";

  // El join a tipos_procedimiento_honorarios siempre se pide — si el usuario
  // no es dueño, RLS simplemente devuelve un array vacío en esa relación,
  // no un error. Así evitamos construir el string de `select` dinámicamente
  // (rompe el tipado de Supabase).
  const { data: tipos } = await supabase
    .from("tipos_procedimiento")
    .select("id, nombre, precio, tipos_procedimiento_honorarios(tarifa)")
    .order("nombre");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-default">Procedimientos</h1>
        <NuevoProcedimientoForm esDueno={esDueno} />
      </div>

      {tipos && tipos.length === 0 && (
        <div className="empty-state">
          <p className="font-display text-lg text-default">Sin procedimientos todavía</p>
          <p className="text-muted text-sm mt-1">
            Crea los tipos de procedimiento que ofreces para poder asignarlos a un
            paciente.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {tipos?.map((t) => {
          // Como tipo_procedimiento_id es la llave primaria de
          // tipos_procedimiento_honorarios (relación 1 a 1), PostgREST a
          // veces la embebe como objeto y a veces como lista de un solo
          // elemento — se acepta cualquiera de las dos formas.
          const relacion = t.tipos_procedimiento_honorarios as
            | { tarifa: number }[]
            | { tarifa: number }
            | null;
          const honorario = esDueno
            ? Array.isArray(relacion)
              ? relacion[0]?.tarifa
              : relacion?.tarifa
            : undefined;

          return (
            <div key={t.id} className="list-row">
              <Stethoscope
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="text-muted"
              />
              <div className="list-row-main">
                <span className="list-row-title">{t.nombre}</span>
                {honorario !== undefined && (
                  <span className="list-row-meta">
                    Honorario: ${honorario.toLocaleString("es-MX")}
                  </span>
                )}
              </div>
              <span className="num text-default font-semibold">
                ${t.precio.toLocaleString("es-MX")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
