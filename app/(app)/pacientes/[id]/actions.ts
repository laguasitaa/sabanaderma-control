"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function borrarRegistro(registroId: string, pacienteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("borrar_registro_uso", {
    p_registro_uso_id: registroId,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/pacientes/${pacienteId}`);
}

export async function actualizarRegistro(
  registroId: string,
  pacienteId: string,
  cambios: {
    fecha: string;
    doctoraId: string | null;
    precioCobrado: number;
    insumosTexto: string | null;
    honorarioMonto: number | null;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("actualizar_registro_uso", {
    p_registro_uso_id: registroId,
    p_fecha: cambios.fecha,
    p_doctora_id: cambios.doctoraId,
    p_precio_cobrado: cambios.precioCobrado,
    p_insumos_texto: cambios.insumosTexto,
    p_honorario_monto: cambios.honorarioMonto,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/pacientes/${pacienteId}`);
}
