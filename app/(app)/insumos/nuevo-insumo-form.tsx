"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { crearInsumo } from "./actions";

export function NuevoInsumoForm({ esDueno }: { esDueno: boolean }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [unidad, setUnidad] = useState("ml");
  const [stock, setStock] = useState("0");
  const [costo, setCosto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!abierto) {
    return (
      <button type="button" className="btn-primary" onClick={() => setAbierto(true)}>
        <Plus size={18} strokeWidth={1.75} aria-hidden="true" />
        Nuevo insumo
      </button>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await crearInsumo(
        nombre.trim(),
        unidad,
        Number(stock),
        esDueno && costo !== "" ? Number(costo) : null,
      );
      setNombre("");
      setStock("0");
      setCosto("");
      setAbierto(false);
      router.refresh();
    } catch {
      setError("No se pudo guardar el insumo. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card flex flex-col gap-3 max-w-sm">
      <div>
        <label className="label-default block mb-1" htmlFor="nombre-insumo">
          Nombre
        </label>
        <input
          id="nombre-insumo"
          className="input-default w-full"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="label-default block mb-1" htmlFor="unidad">
            Unidad
          </label>
          <select
            id="unidad"
            className="input-default w-full"
            value={unidad}
            onChange={(e) => setUnidad(e.target.value)}
          >
            <option value="ml">ml</option>
            <option value="g">g</option>
            <option value="unidad">unidad</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="label-default block mb-1" htmlFor="stock">
            Stock inicial
          </label>
          <input
            id="stock"
            type="number"
            min="0"
            step="0.01"
            className="input-default w-full"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
          />
        </div>
      </div>

      {esDueno && (
        <div>
          <label className="label-default block mb-1" htmlFor="costo">
            Costo de compra por {unidad} (solo tú lo ves)
          </label>
          <input
            id="costo"
            type="number"
            min="0"
            step="0.01"
            className="input-default w-full"
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
            placeholder="Ej: cuánto pagaste por unidad"
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
