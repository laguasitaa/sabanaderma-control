"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { actualizarStockInsumo } from "./actions";

export function StockInsumo({
  insumoId,
  unidadMedida,
  stockActual,
}: {
  insumoId: string;
  unidadMedida: string;
  stockActual: number;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(String(stockActual));
  const [cargando, setCargando] = useState(false);

  if (editando) {
    return (
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setCargando(true);
          try {
            await actualizarStockInsumo(insumoId, Number(valor));
            setEditando(false);
            router.refresh();
          } finally {
            setCargando(false);
          }
        }}
      >
        <input
          type="number"
          min="0"
          step="0.01"
          className="input-default w-32"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          autoFocus
          required
        />
        <span className="text-muted text-sm">{unidadMedida}</span>
        <div className="flex items-center gap-2">
          <button type="submit" className="btn-tertiary" disabled={cargando}>
            {cargando ? "…" : "OK"}
          </button>
          <button type="button" className="btn-tertiary" onClick={() => setEditando(false)}>
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditando(true)}
      className="flex items-center gap-1 text-sm text-default font-semibold"
      title="Editar stock disponible"
    >
      {stockActual} {unidadMedida}
      <Pencil size={12} strokeWidth={1.75} aria-hidden="true" className="text-muted" />
    </button>
  );
}
