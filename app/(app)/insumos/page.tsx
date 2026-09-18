import { Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPerfilActual } from "@/lib/data/perfil";
import { NuevoInsumoForm } from "./nuevo-insumo-form";
import { CostoInsumo } from "./costo-insumo";

export default async function InsumosPage() {
  const supabase = await createClient();
  const perfil = await getPerfilActual();
  const esDueno = perfil?.role === "dueno";

  // El join a insumos_costos siempre se pide — si el usuario no es dueño,
  // RLS devuelve esa relación vacía (no un error).
  const { data: insumos } = await supabase
    .from("insumos")
    .select("id, nombre, unidad_medida, stock, insumos_costos(costo_unitario)")
    .order("nombre");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-default">Insumos</h1>
        <NuevoInsumoForm esDueno={esDueno} />
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
        {insumos?.map((i) => {
          // insumos_costos es 1 a 1 (llave primaria = llave foránea) — a
          // veces PostgREST lo embebe como objeto y a veces como lista de
          // un elemento, según la versión.
          const relacion = i.insumos_costos as
            | { costo_unitario: number }[]
            | { costo_unitario: number }
            | null;
          const costoActual = esDueno
            ? Array.isArray(relacion)
              ? relacion[0]?.costo_unitario
              : relacion?.costo_unitario
            : undefined;

          return (
            <div key={i.id} className="list-row">
              <Package
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="text-muted"
              />
              <div className="list-row-main">
                <span className="list-row-title">{i.nombre}</span>
                {esDueno && (
                  <CostoInsumo
                    insumoId={i.id}
                    unidadMedida={i.unidad_medida}
                    costoActual={costoActual}
                  />
                )}
              </div>
              <span className="num text-default font-semibold">
                {i.stock} {i.unidad_medida}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
