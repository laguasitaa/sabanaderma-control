"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { registrarProcedimiento } from "./actions";
import { formatCOP } from "@/lib/format";

type TipoProcedimiento = { id: string; nombre: string; codigo: string | null; precio: number };
type Insumo = { id: string; nombre: string; unidad_medida: string; stock: number };
type Doctora = { id: string; nombre: string };

type FilaInsumo = { insumo_id: string; cantidad: string };

export function AsignarProcedimientoForm({
  pacienteId,
  tiposProcedimiento,
  insumosDisponibles,
  doctoras,
}: {
  pacienteId: string;
  tiposProcedimiento: TipoProcedimiento[];
  insumosDisponibles: Insumo[];
  doctoras: Doctora[];
}) {
  const router = useRouter();
  const [tipoId, setTipoId] = useState(tiposProcedimiento[0]?.id ?? "");
  const [precio, setPrecio] = useState(String(tiposProcedimiento[0]?.precio ?? ""));
  const [doctoraId, setDoctoraId] = useState(doctoras[0]?.id ?? "");
  const [filas, setFilas] = useState<FilaInsumo[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onTipoChange(id: string) {
    setTipoId(id);
    const tipo = tiposProcedimiento.find((t) => t.id === id);
    if (tipo) setPrecio(String(tipo.precio));
  }

  function agregarFila() {
    setFilas([...filas, { insumo_id: insumosDisponibles[0]?.id ?? "", cantidad: "" }]);
  }

  function quitarFila(idx: number) {
    setFilas(filas.filter((_, i) => i !== idx));
  }

  function actualizarFila(idx: number, cambio: Partial<FilaInsumo>) {
    setFilas(filas.map((f, i) => (i === idx ? { ...f, ...cambio } : f)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const insumosUsados = filas
      .filter((f) => f.insumo_id && Number(f.cantidad) > 0)
      .map((f) => ({ insumo_id: f.insumo_id, cantidad: Number(f.cantidad) }));

    setCargando(true);
    try {
      await registrarProcedimiento(
        pacienteId,
        tipoId,
        Number(precio),
        insumosUsados,
        doctoraId || null,
      );
      router.push(`/pacientes/${pacienteId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg.includes("stock insuficiente")
          ? "No hay suficiente stock de uno de los insumos. Ajusta la cantidad o revisa el inventario."
          : "No se pudo registrar el procedimiento. Intenta de nuevo.",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <label className="label-default block mb-1" htmlFor="tipo">
          Tipo de procedimiento
        </label>
        <select
          id="tipo"
          className="input-default w-full"
          value={tipoId}
          onChange={(e) => onTipoChange(e.target.value)}
        >
          {tiposProcedimiento.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
              {t.codigo ? ` (${t.codigo})` : ""} — {formatCOP(t.precio)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label-default block mb-1" htmlFor="doctora">
          Doctora
        </label>
        <select
          id="doctora"
          className="input-default w-full"
          value={doctoraId}
          onChange={(e) => setDoctoraId(e.target.value)}
        >
          {doctoras.length === 0 && <option value="">Sin doctoras registradas</option>}
          {doctoras.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label-default block mb-1" htmlFor="precio">
          Precio cobrado al paciente
        </label>
        <input
          id="precio"
          type="number"
          min="0"
          step="0.01"
          className="input-default w-full"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="label-default">Insumos usados</span>
          <button
            type="button"
            onClick={agregarFila}
            className="btn-tertiary"
            disabled={insumosDisponibles.length === 0}
          >
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
            Agregar insumo
          </button>
        </div>

        {insumosDisponibles.length === 0 && (
          <p className="help-text">
            No hay insumos registrados todavía — puedes registrar el procedimiento sin
            insumos, o crearlos primero en Insumos.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {filas.map((fila, idx) => {
            const insumo = insumosDisponibles.find((i) => i.id === fila.insumo_id);
            return (
              <div key={idx} className="flex items-center gap-2">
                <select
                  className="input-default flex-1"
                  value={fila.insumo_id}
                  onChange={(e) => actualizarFila(idx, { insumo_id: e.target.value })}
                >
                  {insumosDisponibles.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nombre} (stock: {i.stock}
                      {i.unidad_medida})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder={insumo?.unidad_medida ?? "cantidad"}
                  className="input-default w-28"
                  value={fila.cantidad}
                  onChange={(e) => actualizarFila(idx, { cantidad: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => quitarFila(idx)}
                  className="icon-btn"
                  aria-label="Quitar insumo"
                >
                  <X size={16} strokeWidth={1.75} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn-primary" disabled={cargando}>
        {cargando ? "Guardando…" : "Guardar procedimiento"}
      </button>
    </form>
  );
}
