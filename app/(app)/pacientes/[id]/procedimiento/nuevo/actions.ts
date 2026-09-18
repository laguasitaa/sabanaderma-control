"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type InsumoUsado = { insumo_id: string; cantidad: number };

export async function registrarProcedimiento(
  pacienteId: string,
  tipoProcedimientoId: string,
  precioCobrado: number,
  insumos: InsumoUsado[],
  doctoraId: string | null,
  formaPago: string | null,
  notaSeguimiento: string | null,
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("registrar_procedimiento", {
    p_paciente_id: pacienteId,
    p_tipo_procedimiento_id: tipoProcedimientoId,
    p_precio_cobrado: precioCobrado,
    p_insumos: insumos,
    p_doctora_id: doctoraId,
    p_forma_pago: formaPago,
    p_nota_seguimiento: notaSeguimiento,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/pacientes/${pacienteId}`);
}
