"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function crearInsumo(
  nombre: string,
  unidadMedida: string,
  stockInicial: number,
  costoUnitario: number | null,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("insumos")
    .insert({ nombre, unidad_medida: unidadMedida, stock: stockInicial })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (costoUnitario !== null) {
    const { error: errorCosto } = await supabase
      .from("insumos_costos")
      .insert({ insumo_id: data.id, costo_unitario: costoUnitario });
    if (errorCosto) throw new Error(errorCosto.message);
  }

  revalidatePath("/insumos");
}

export async function actualizarCostoInsumo(insumoId: string, costoUnitario: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("insumos_costos")
    .upsert({ insumo_id: insumoId, costo_unitario: costoUnitario, updated_at: new Date().toISOString() });

  if (error) throw new Error(error.message);
  revalidatePath("/insumos");
}
