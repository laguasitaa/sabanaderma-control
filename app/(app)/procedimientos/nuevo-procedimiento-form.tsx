"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { crearTipoProcedimiento } from "./actions";

export function NuevoProcedimientoForm({ esDueno }: { esDueno: boolean }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [tarifa, setTarifa] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!abierto) {
    return (
      <button type="button" className="btn-primary" onClick={() => setAbierto(true)}>
        <Plus size={18} strokeWidth={1.75} aria-hidden="true" />
        Nuevo procedimiento
      </button>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await crearTipoProcedimiento(
        nombre.trim(),
        Number(precio),
        esDueno && tarifa !== "" ? Number(tarifa) : null,
      );
      setNombre("");
      setPrecio("");
      setTarifa("");
      setAbierto(false);
      router.refresh();
    } catch {
      setError("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card flex flex-col gap-3 max-w-sm">
      <div>
        <label className="label-default block mb-1" htmlFor="nombre-proc">
          Nombre del procedimiento
        </label>
        <input
          id="nombre-proc"
          className="input-default w-full"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="label-default block mb-1" htmlFor="precio-proc">
          Precio al paciente
        </label>
        <input
          id="precio-proc"
          type="number"
          min="0"
          step="0.01"
          className="input-default w-full"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          required
        />
      </div>

      {esDueno && (
        <div>
          <label className="label-default block mb-1" htmlFor="tarifa-proc">
            Honorario médico (solo tú lo ves)
          </label>
          <input
            id="tarifa-proc"
            type="number"
            min="0"
            step="0.01"
            className="input-default w-full"
            value={tarifa}
            onChange={(e) => setTarifa(e.target.value)}
          />
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      <div className="flex gap-2">
        <button type="button" className="btn-tertiary" onClick={() => setAbierto(false)}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={cargando}>
          {cargando ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
