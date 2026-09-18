import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPerfilActual } from "@/lib/data/perfil";
import { CostoInsumo } from "../costo-insumo";
import { StockInsumo } from "../stock-insumo";

export default async function DetalleInsumoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const perfil = await getPerfilActual();
  const esDueno = perfil?.role === "dueno";

  const { data: insumo } = await supabase
    .from("insumos")
    .select("id, nombre, unidad_medida, stock, stock_inicial, insumos_costos(costo_unitario)")
    .eq("id", id)
    .single();

  if (!insumo) notFound();

  // insumos_costos es 1 a 1 — a veces llega como objeto, a veces como lista
  // de un elemento, según la versión de PostgREST.
  const relacion = insumo.insumos_costos as
    | { costo_unitario: number }[]
    | { costo_unitario: number }
    | null;
  const costoUnitario = esDueno
    ? Array.isArray(relacion)
      ? relacion[0]?.costo_unitario
      : relacion?.costo_unitario
    : undefined;

  const usado = insumo.stock_inicial - insumo.stock;
  const porcentajeRestante =
    insumo.stock_inicial > 0 ? Math.round((insumo.stock / insumo.stock_inicial) * 100) : 0;

  return (
    <div className="flex flex-col gap-4 max-w-md">
      <Link href="/insumos" className="flex items-center gap-1 text-sm text-muted w-fit">
        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
        Insumos
      </Link>

      <h1 className="font-display text-2xl text-default">{insumo.nombre}</h1>

      <div className="card flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-muted text-sm">Cantidad original comprada</span>
          <span className="num text-default font-semibold">
            {insumo.stock_inicial} {insumo.unidad_medida}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted text-sm">Usado hasta ahora</span>
          <span className="num text-default font-semibold">
            {usado} {insumo.unidad_medida}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted text-sm">Queda disponible</span>
          <StockInsumo
            insumoId={insumo.id}
            unidadMedida={insumo.unidad_medida}
            stockActual={insumo.stock}
          />
        </div>

        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 8, backgroundColor: "var(--c-border)" }}
        >
          <div
            style={{
              width: `${porcentajeRestante}%`,
              height: "100%",
              backgroundColor: "var(--c-accent)",
              transition: "width var(--motion-duration) var(--motion-easing)",
            }}
          />
        </div>
        <span className="text-muted text-xs">{porcentajeRestante}% disponible</span>
      </div>

      {esDueno && (
        <div className="card flex flex-col gap-3">
          <p className="font-display text-lg text-default">Costo de compra</p>
          <CostoInsumo
            insumoId={insumo.id}
            unidadMedida={insumo.unidad_medida}
            costoActual={costoUnitario}
          />

          {costoUnitario !== undefined && (
            <>
              <div className="flex items-center justify-between mt-2">
                <span className="text-muted text-sm">Invertido originalmente</span>
                <span className="num text-default font-semibold">
                  ${(costoUnitario * insumo.stock_inicial).toLocaleString("es-MX")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted text-sm">Valor de lo que queda</span>
                <span className="num text-default font-semibold">
                  ${(costoUnitario * insumo.stock).toLocaleString("es-MX")}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
