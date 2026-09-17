"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { borrarRegistro } from "./actions";

export function EliminarRegistroBoton({
  registroId,
  pacienteId,
}: {
  registroId: string;
  pacienteId: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [pendiente, startTransition] = useTransition();

  if (confirmando) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-tertiary"
          onClick={() => setConfirmando(false)}
          autoFocus
        >
          Cancelar
        </button>
        <button
          type="button"
          className="btn-danger"
          disabled={pendiente}
          onClick={() =>
            startTransition(async () => {
              await borrarRegistro(registroId, pacienteId);
              setConfirmando(false);
            })
          }
        >
          {pendiente ? "Eliminando…" : "Sí, eliminar"}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="icon-btn"
      aria-label="Eliminar registro"
      title="Eliminar registro (devuelve el insumo al inventario)"
      onClick={() => setConfirmando(true)}
    >
      <Trash2 size={16} strokeWidth={1.75} />
    </button>
  );
}
