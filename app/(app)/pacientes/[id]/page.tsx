import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPerfilActual } from "@/lib/data/perfil";
import { EliminarRegistroBoton } from "./eliminar-boton";

type RegistroFila = {
  id: string;
  precio_cobrado: number;
  created_at: string;
  tipos_procedimiento: { nombre: string } | null;
  doctoras: { nombre: string } | null;
  registros_uso_insumos: { cantidad: number; insumos: { nombre: string; unidad_medida: string } | null }[];
  honorarios: { monto: number } | null;
};

export default async function DetallePacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const perfil = await getPerfilActual();

  const { data: paciente } = await supabase
    .from("pacientes")
    .select("id, nombre, telefono")
    .eq("id", id)
    .single();

  if (!paciente) notFound();

  const { data: registros } = await supabase
    .from("registros_uso")
    .select(
      `id, precio_cobrado, created_at,
       tipos_procedimiento(nombre),
       doctoras(nombre),
       registros_uso_insumos(cantidad, insumos(nombre, unidad_medida)),
       honorarios(monto)`,
    )
    .eq("paciente_id", id)
    .order("created_at", { ascending: false })
    .returns<RegistroFila[]>();

  return (
    <div className="flex flex-col gap-4">
      <Link href="/pacientes" className="flex items-center gap-1 text-sm text-muted w-fit">
        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
        Pacientes
      </Link>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-default">{paciente.nombre}</h1>
          <p className="text-muted text-sm">{paciente.telefono}</p>
        </div>
        <Link href={`/pacientes/${id}/procedimiento/nuevo`} className="btn-primary">
          <Plus size={18} strokeWidth={1.75} aria-hidden="true" />
          Asignar procedimiento
        </Link>
      </div>

      <h2 className="font-display text-lg text-default mt-2">Historial</h2>

      {registros && registros.length === 0 && (
        <div className="empty-state">
          <p className="font-display text-lg text-default">Sin procedimientos todavía</p>
          <p className="text-muted text-sm mt-1 mb-4">
            Asigna el primer procedimiento para empezar el historial.
          </p>
          <Link href={`/pacientes/${id}/procedimiento/nuevo`} className="btn-primary">
            <Plus size={18} strokeWidth={1.75} aria-hidden="true" />
            Asignar procedimiento
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {registros?.map((r) => (
          <div key={r.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-default">
                  {r.tipos_procedimiento?.nombre ?? "Procedimiento"}
                </p>
                <p className="text-muted text-sm">
                  {new Date(r.created_at).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {r.doctoras?.nombre ? ` · ${r.doctoras.nombre}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="num font-semibold text-default">
                  ${r.precio_cobrado.toLocaleString("es-MX")}
                </span>
                <EliminarRegistroBoton registroId={r.id} pacienteId={id} />
              </div>
            </div>

            {r.registros_uso_insumos.length > 0 && (
              <p className="text-muted text-sm mt-2">
                Insumos:{" "}
                {r.registros_uso_insumos
                  .map((i) => `${i.insumos?.nombre} (${i.cantidad}${i.insumos?.unidad_medida})`)
                  .join(", ")}
              </p>
            )}

            {perfil?.role === "dueno" && r.honorarios && (
              <p className="text-muted text-sm mt-1">
                Honorario: <span className="num">${r.honorarios.monto.toLocaleString("es-MX")}</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
