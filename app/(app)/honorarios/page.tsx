import { getPerfilActual } from "@/lib/data/perfil";
import { createClient } from "@/lib/supabase/server";
import { formatCOP, formatFechaCO } from "@/lib/format";

type Fila = {
  id: string;
  monto: number;
  created_at: string;
  registros_uso: {
    precio_cobrado: number;
    pacientes: { nombre: string } | null;
    tipos_procedimiento: { nombre: string } | null;
  } | null;
};

export default async function HonorariosPage() {
  const perfil = await getPerfilActual();

  if (perfil?.role !== "dueno") {
    return (
      <div className="empty-state">
        <p className="font-display text-lg text-default">Esta sección es solo del dueño</p>
        <p className="text-muted text-sm mt-1">
          Aquí se ven los honorarios y reportes de dinero de la clínica.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: honorarios } = await supabase
    .from("honorarios")
    .select(
      `id, monto, created_at,
       registros_uso(precio_cobrado, pacientes(nombre), tipos_procedimiento(nombre))`,
    )
    .order("created_at", { ascending: false })
    .returns<Fila[]>();

  const total = honorarios?.reduce((acc, h) => acc + h.monto, 0) ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl text-default">Honorarios</h1>

      <div className="card w-fit">
        <p className="text-muted text-sm">Total acumulado</p>
        <p className="font-display text-3xl text-default num">{formatCOP(total)}</p>
      </div>

      {honorarios && honorarios.length === 0 && (
        <div className="empty-state">
          <p className="font-display text-lg text-default">Sin honorarios todavía</p>
          <p className="text-muted text-sm mt-1">
            Aparecen aquí en cuanto se asigne un procedimiento a un paciente.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {honorarios?.map((h) => (
          <div key={h.id} className="list-row">
            <div className="list-row-main">
              <span className="list-row-title">
                {h.registros_uso?.pacientes?.nombre ?? "Paciente"} —{" "}
                {h.registros_uso?.tipos_procedimiento?.nombre ?? "Procedimiento"}
              </span>
              <span className="list-row-meta">{formatFechaCO(h.created_at)}</span>
            </div>
            <span className="num text-default font-semibold">{formatCOP(h.monto)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
