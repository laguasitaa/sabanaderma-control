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
