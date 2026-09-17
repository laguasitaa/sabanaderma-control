"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function crearTipoProcedimiento(
  nombre: string,
  precio: number,
  tarifaHonorario: number | null,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tipos_procedimiento")
    .insert({ nombre, precio })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (tarifaHonorario !== null) {
    const { error: errorTarifa } = await supabase
      .from("tipos_procedimiento_honorarios")
      .insert({ tipo_procedimiento_id: data.id, tarifa: tarifaHonorario });
    if (errorTarifa) throw new Error(errorTarifa.message);
  }

  revalidatePath("/procedimientos");
}
