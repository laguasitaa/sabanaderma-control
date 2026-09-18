"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buscarPosiblesDuplicados, crearPaciente } from "./actions";

type Posible = { id: string; nombre: string; telefono: string | null; documento: string | null };

export default function NuevoPacientePage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [posibles, setPosibles] = useState<Posible[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onBuscar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const encontrados = await buscarPosiblesDuplicados(nombre.trim(), telefono.trim());
      if (encontrados.length > 0) {
        setPosibles(encontrados);
      } else {
        await crearYRedirigir();
      }
    } catch {
      setError("No se pudo buscar. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  async function crearYRedirigir() {
    setCargando(true);
    setError(null);
    try {
      const id = await crearPaciente(nombre.trim(), telefono.trim());
      router.push(`/pacientes/${id}`);
    } catch {
      setError("No se pudo registrar al paciente. Intenta de nuevo.");
      setCargando(false);
    }
  }

  if (posibles) {
    return (
      <div className="flex flex-col gap-4 max-w-lg">
        <button
          type="button"
          onClick={() => setPosibles(null)}
          className="flex items-center gap-1 text-sm text-muted"
        >
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
          Volver
        </button>

        <h1 className="font-display text-xl text-default">
          Encontramos pacientes parecidos
        </h1>
        <p className="text-muted text-sm">
          Antes de crear uno nuevo, confirma que no sea alguno de estos — así no
          duplicamos el historial.
        </p>

        <div className="flex flex-col gap-2">
          {posibles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => router.push(`/pacientes/${p.id}`)}
              className="list-row text-left"
            >
              <div className="list-row-main">
                <span className="list-row-title">{p.nombre}</span>
                <span className="list-row-meta">
                  {p.telefono || (p.documento ? `CC ${p.documento}` : "Sin teléfono")}
                </span>
              </div>
            </button>
          ))}
        </div>

        {error && <p className="error-text">{error}</p>}

        <button
          type="button"
          onClick={crearYRedirigir}
          className="btn-secondary"
          disabled={cargando}
        >
          {cargando ? "Creando…" : "No es ninguno — crear paciente nuevo"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-sm">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted"
      >
        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
        Volver
      </button>

      <h1 className="font-display text-xl text-default">Nuevo paciente</h1>

      <form onSubmit={onBuscar} className="flex flex-col gap-4">
        <div>
          <label className="label-default block mb-1" htmlFor="nombre">
            Nombre completo
          </label>
          <input
            id="nombre"
            className="input-default w-full"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label-default block mb-1" htmlFor="telefono">
            Teléfono
          </label>
          <input
            id="telefono"
            type="tel"
            className="input-default w-full"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            required
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn-primary" disabled={cargando}>
          {cargando ? "Buscando…" : "Continuar"}
        </button>
      </form>
    </div>
  );
}
