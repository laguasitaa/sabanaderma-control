import { Download } from "lucide-react";
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
    doctoras: { nombre: string } | null;
  } | null;
};

const MOSTRAR_EN_PANTALLA = 100;

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

  // Supabase/PostgREST devuelve máximo 1000 filas por consulta — con miles
  // de honorarios históricos, el total mostrado quedaba mal si no se
  // paginaba. Se traen todas las filas para los totales; en pantalla solo
  // se listan las más recientes (para eso está el botón de descarga).
  const TAMANO_PAGINA = 1000;
  const honorarios: Fila[] = [];
  for (let desde = 0; ; desde += TAMANO_PAGINA) {
    const { data, error } = await supabase
      .from("honorarios")
      .select(
        `id, monto, created_at,
         registros_uso(precio_cobrado, pacientes(nombre), tipos_procedimiento(nombre), doctoras(nombre))`,
      )
      .order("created_at", { ascending: false })
      .range(desde, desde + TAMANO_PAGINA - 1)
      .returns<Fila[]>();

    if (error) break;
    honorarios.push(...data);
    if (data.length < TAMANO_PAGINA) break;
  }

  const total = honorarios.reduce((acc, h) => acc + h.monto, 0);

  const porDoctora = new Map<string, number>();
  for (const h of honorarios) {
    const nombre = h.registros_uso?.doctoras?.nombre ?? "Sin doctora asignada";
    porDoctora.set(nombre, (porDoctora.get(nombre) ?? 0) + h.monto);
  }
  const totalesPorDoctora = [...porDoctora.entries()].sort((a, b) => b[1] - a[1]);

  const recientes = honorarios.slice(0, MOSTRAR_EN_PANTALLA);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-default">Honorarios</h1>
        <a href="/honorarios/exportar" className="btn-secondary">
          <Download size={18} strokeWidth={1.75} aria-hidden="true" />
          Descargar para contaduría
        </a>
      </div>

      <div className="card w-fit">
        <p className="text-muted text-sm">Total acumulado ({honorarios.length} registros)</p>
        <p className="font-display text-3xl text-default num">{formatCOP(total)}</p>
      </div>

      {totalesPorDoctora.length > 0 && (
        <div className="card">
          <p className="font-display text-lg text-default mb-2">Por doctora</p>
          <div className="flex flex-col gap-2">
            {totalesPorDoctora.map(([nombre, monto]) => (
              <div key={nombre} className="flex items-center justify-between">
                <span className="text-default text-sm">{nombre}</span>
                <span className="num text-default font-semibold">{formatCOP(monto)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {honorarios.length === 0 && (
        <div className="empty-state">
          <p className="font-display text-lg text-default">Sin honorarios todavía</p>
          <p className="text-muted text-sm mt-1">
            Aparecen aquí en cuanto se asigne un procedimiento a un paciente.
          </p>
        </div>
      )}

      {honorarios.length > MOSTRAR_EN_PANTALLA && (
        <p className="text-muted text-sm">
          Mostrando los {MOSTRAR_EN_PANTALLA} más recientes de {honorarios.length}. Para ver todos,
          descarga el archivo para contaduría.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {recientes.map((h) => (
          <div key={h.id} className="list-row">
            <div className="list-row-main">
              <span className="list-row-title">
                {h.registros_uso?.pacientes?.nombre ?? "Paciente"} —{" "}
                {h.registros_uso?.tipos_procedimiento?.nombre ?? "Procedimiento"}
              </span>
              <span className="list-row-meta">
                {formatFechaCO(h.created_at)}
                {h.registros_uso?.doctoras?.nombre ? ` · ${h.registros_uso.doctoras.nombre}` : ""}
              </span>
            </div>
            <span className="num text-default font-semibold">{formatCOP(h.monto)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
