import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPerfilActual } from "@/lib/data/perfil";
import { RegistroCard } from "./registro-card";

type RegistroFila = {
  id: string;
  precio_cobrado: number;
  created_at: string;
  importado_historico: boolean;
  procedimiento_texto_historico: string | null;
  insumos_texto_historico: string | null;
  doctora_id: string | null;
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
  const esDueno = perfil?.role === "dueno";

  const { data: paciente } = await supabase
    .from("pacientes")
    .select("id, nombre, telefono, documento")
    .eq("id", id)
    .single();

  if (!paciente) notFound();

  const { data: registros } = await supabase
    .from("registros_uso")
    .select(
      `id, precio_cobrado, created_at, importado_historico, procedimiento_texto_historico, insumos_texto_historico, doctora_id,
       tipos_procedimiento(nombre),
       doctoras(nombre),
       registros_uso_insumos(cantidad, insumos(nombre, unidad_medida)),
       honorarios(monto)`,
    )
    .eq("paciente_id", id)
    .order("created_at", { ascending: false })
    .returns<RegistroFila[]>();

  const { data: doctoras } = await supabase.from("doctoras").select("id, nombre").order("nombre");

  return (
    <div className="flex flex-col gap-4">
      <Link href="/pacientes" className="flex items-center gap-1 text-sm text-muted w-fit">
        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
        Pacientes
      </Link>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-default">{paciente.nombre}</h1>
          <p className="text-muted text-sm">
            {[paciente.telefono, paciente.documento ? `CC ${paciente.documento}` : null]
              .filter(Boolean)
              .join(" · ") || "Sin teléfono ni cédula"}
          </p>
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

      <div className="flex flex-col gap-3">
        {registros?.map((r) => (
          <RegistroCard
            key={r.id}
            registroId={r.id}
            pacienteId={id}
            titulo={r.tipos_procedimiento?.nombre ?? r.procedimiento_texto_historico ?? "Procedimiento"}
            fecha={r.created_at}
            doctoraId={r.doctora_id}
            doctoraNombre={r.doctoras?.nombre ?? null}
            importadoHistorico={r.importado_historico}
            precioCobrado={r.precio_cobrado}
            insumosEstructurados={
              r.registros_uso_insumos.length > 0
                ? r.registros_uso_insumos
                    .map((i) => `${i.insumos?.nombre} (${i.cantidad}${i.insumos?.unidad_medida})`)
                    .join(", ")
                : null
            }
            insumosTexto={r.insumos_texto_historico}
            honorarioMonto={r.honorarios?.monto ?? null}
            doctoras={doctoras ?? []}
            esDueno={esDueno}
          />
        ))}
      </div>
    </div>
  );
}
