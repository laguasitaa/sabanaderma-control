import { Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NuevoInsumoForm } from "./nuevo-insumo-form";

export default async function InsumosPage() {
  const supabase = await createClient();
  const { data: insumos } = await supabase
    .from("insumos")
    .select("id, nombre, unidad_medida, stock")
    .order("nombre");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-default">Insumos</h1>
        <NuevoInsumoForm />
      </div>

      {insumos && insumos.length === 0 && (
        <div className="empty-state">
          <p className="font-display text-lg text-default">Sin insumos registrados</p>
          <p className="text-muted text-sm mt-1">
            Registra tus insumos para poder descontarlos al asignar procedimientos.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {insumos?.map((i) => (
          <div key={i.id} className="list-row">
            <Package size={20} strokeWidth={1.75} aria-hidden="true" className="text-muted" />
            <div className="list-row-main">
              <span className="list-row-title">{i.nombre}</span>
            </div>
            <span className="num text-default font-semibold">
              {i.stock} {i.unidad_medida}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
