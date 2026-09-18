import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AsignarProcedimientoForm } from "./form";

export default async function NuevoProcedimientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: paciente } = await supabase
    .from("pacientes")
    .select("id, nombre")
    .eq("id", id)
    .single();

  if (!paciente) notFound();

  const { data: tiposProcedimiento } = await supabase
    .from("tipos_procedimiento")
    .select("id, nombre, precio")
    .order("nombre");

  const { data: insumos } = await supabase
    .from("insumos")
    .select("id, nombre, unidad_medida, stock")
    .order("nombre");

  const { data: doctoras } = await supabase
    .from("doctoras")
    .select("id, nombre")
    .eq("activa", true)
    .order("nombre");

  return (
    <div className="max-w-lg flex flex-col gap-4">
      <div>
        <h1 className="font-display text-xl text-default">Asignar procedimiento</h1>
        <p className="text-muted text-sm">Paciente: {paciente.nombre}</p>
      </div>

      {(!tiposProcedimiento || tiposProcedimiento.length === 0) && (
        <p className="error-text">
          Todavía no hay tipos de procedimiento registrados.{" "}
          <a href="/procedimientos" className="underline">
            Créalos aquí primero
          </a>
          .
        </p>
      )}

      {tiposProcedimiento && tiposProcedimiento.length > 0 && (
        <AsignarProcedimientoForm
          pacienteId={paciente.id}
          tiposProcedimiento={tiposProcedimiento}
          insumosDisponibles={insumos ?? []}
          doctoras={doctoras ?? []}
        />
      )}
    </div>
  );
}
