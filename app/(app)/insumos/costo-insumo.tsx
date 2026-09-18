"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { actualizarCostoInsumo } from "./actions";

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
        className="flex items-center gap-1"
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
          className="input-default w-24 text-sm"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          autoFocus
          required
        />
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
        ? `Costo: $${costoActual.toLocaleString("es-MX")}/${unidadMedida}`
        : "Sin costo registrado"}
      <Pencil size={12} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
