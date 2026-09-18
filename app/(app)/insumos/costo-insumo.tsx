"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { actualizarCostoInsumo } from "./actions";
import { formatCOP } from "@/lib/format";

export function CostoInsumo({
  insumoId,
  unidadMedida,
  costoActual,
}: {
  insumoId: string;
  unidadMedida: string;
  costoActual: number | undefined;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(costoActual !== undefined ? String(costoActual) : "");
  const [cargando, setCargando] = useState(false);

  if (editando) {
    return (
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setCargando(true);
          try {
            await actualizarCostoInsumo(insumoId, Number(valor));
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
        <span className="text-muted text-sm">COP / {unidadMedida}</span>
        <button type="submit" className="btn-tertiary" disabled={cargando}>
          {cargando ? "…" : "OK"}
        </button>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditando(true)}
      className="flex items-center gap-1 text-sm text-muted"
      title="Editar costo de compra"
    >
      {costoActual !== undefined
        ? `Costo: ${formatCOP(costoActual)}/${unidadMedida}`
        : "Sin costo registrado"}
      <Pencil size={12} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
