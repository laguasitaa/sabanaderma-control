"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function crearInsumo(nombre: string, unidadMedida: string, stockInicial: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("insumos")
    .insert({ nombre, unidad_medida: unidadMedida, stock: stockInicial });

  if (error) throw new Error(error.message);
  revalidatePath("/insumos");
}
