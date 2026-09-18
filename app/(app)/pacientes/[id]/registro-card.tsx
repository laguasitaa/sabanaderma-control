"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { formatCOP, formatFechaCO } from "@/lib/format";
import { actualizarRegistro } from "./actions";
import { EliminarRegistroBoton } from "./eliminar-boton";

type Doctora = { id: string; nombre: string };

export function RegistroCard({
  registroId,
  pacienteId,
  titulo,
  fecha,
  doctoraId,
  doctoraNombre,
  importadoHistorico,
  precioCobrado,
  insumosEstructurados,
  insumosTexto,
  honorarioMonto,
  doctoras,
  esDueno,
}: {
  registroId: string;
  pacienteId: string;
  titulo: string;
  fecha: string;
  doctoraId: string | null;
  doctoraNombre: string | null;
  importadoHistorico: boolean;
  precioCobrado: number;
  insumosEstructurados: string | null;
  insumosTexto: string | null;
  honorarioMonto: number | null;
  doctoras: Doctora[];
  esDueno: boolean;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [fechaValor, setFechaValor] = useState(fecha.slice(0, 10));
  const [doctoraValor, setDoctoraValor] = useState(doctoraId ?? "");
  const [precioValor, setPrecioValor] = useState(String(precioCobrado));
  const [insumosValor, setInsumosValor] = useState(insumosTexto ?? "");
  const [honorarioValor, setHonorarioValor] = useState(
    honorarioMonto !== null ? String(honorarioMonto) : "",
  );
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await actualizarRegistro(registroId, pacienteId, {
        fecha: new Date(fechaValor).toISOString(),
        doctoraId: doctoraValor || null,
        precioCobrado: Number(precioValor),
        insumosTexto: insumosValor || null,
        honorarioMonto: esDueno && honorarioValor !== "" ? Number(honorarioValor) : null,
      });
      setEditando(false);
      router.refresh();
    } catch {
      setError("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-default">{titulo}</p>
          <p className="text-muted text-sm">
            {formatFechaCO(fecha)}
            {doctoraNombre ? ` · ${doctoraNombre}` : ""}
            {importadoHistorico ? " · Importado del histórico" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="num font-semibold text-default">{formatCOP(precioCobrado)}</span>
          <button
            type="button"
            onClick={() => setEditando((v) => !v)}
            className="icon-btn"
            aria-label="Editar registro"
            title="Editar registro"
          >
            <Pencil size={16} strokeWidth={1.75} />
          </button>
          <EliminarRegistroBoton registroId={registroId} pacienteId={pacienteId} />
        </div>
      </div>

      {insumosEstructurados && <p className="text-muted text-sm">Insumos: {insumosEstructurados}</p>}

      {!insumosEstructurados && insumosTexto && (
        <p className="text-muted text-sm">Insumos (texto original del histórico): {insumosTexto}</p>
      )}

      {esDueno && honorarioMonto !== null && (
        <p className="text-muted text-sm">
          Honorario: <span className="num">{formatCOP(honorarioMonto)}</span>
        </p>
      )}

      {editando && (
        <form onSubmit={onSubmit} className="flex flex-col gap-3 pt-3 border-t border-default">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label-default block mb-1" htmlFor={`fecha-${registroId}`}>
                Fecha
              </label>
              <input
                id={`fecha-${registroId}`}
                type="date"
                className="input-default w-full"
                value={fechaValor}
                onChange={(e) => setFechaValor(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label-default block mb-1" htmlFor={`precio-${registroId}`}>
                Precio cobrado
              </label>
              <input
                id={`precio-${registroId}`}
                type="number"
                min="0"
                step="0.01"
                className="input-default w-full"
                value={precioValor}
                onChange={(e) => setPrecioValor(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="label-default block mb-1" htmlFor={`doctora-${registroId}`}>
              Doctora
            </label>
            <select
              id={`doctora-${registroId}`}
              className="input-default w-full"
              value={doctoraValor}
              onChange={(e) => setDoctoraValor(e.target.value)}
            >
              <option value="">Sin doctora asignada</option>
              {doctoras.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-default block mb-1" htmlFor={`insumos-${registroId}`}>
              Nota de insumos
            </label>
            <input
              id={`insumos-${registroId}`}
              className="input-default w-full"
              value={insumosValor}
              onChange={(e) => setInsumosValor(e.target.value)}
              placeholder="Ej: gorro, gel conductor, algodón…"
            />
          </div>

          {esDueno && (
            <div>
              <label className="label-default block mb-1" htmlFor={`honorario-${registroId}`}>
                Honorario (solo tú lo ves)
              </label>
              <input
                id={`honorario-${registroId}`}
                type="number"
                min="0"
                step="0.01"
                className="input-default w-full"
                value={honorarioValor}
                onChange={(e) => setHonorarioValor(e.target.value)}
              />
            </div>
          )}

          {error && <p className="error-text">{error}</p>}

          <div className="flex gap-2">
            <button type="button" className="btn-tertiary" onClick={() => setEditando(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={cargando}>
              {cargando ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
