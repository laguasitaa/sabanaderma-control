import Link from "next/link";
import { Plus, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("pacientes")
    .select("id, nombre, telefono, documento, created_at")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%,documento.ilike.%${q}%`);
  }

  const { data: pacientes, error } = await query;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-default">Pacientes</h1>
        <Link href="/pacientes/nuevo" className="btn-primary">
          <Plus size={18} strokeWidth={1.75} aria-hidden="true" />
          Nuevo paciente
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre, teléfono o cédula"
          className="input-default w-full max-w-sm"
        />
      </form>

      {error && <p className="error-text">No se pudieron cargar los pacientes.</p>}

      {pacientes && pacientes.length === 0 && (
        <div className="empty-state">
          <p className="font-display text-lg text-default">
            {q ? "No encontramos a nadie con esa búsqueda" : "Todavía no hay pacientes"}
          </p>
          <p className="text-muted text-sm mt-1 mb-4">
            {q
              ? "Prueba con otro nombre, teléfono o cédula."
              : "Registra al primer paciente para empezar a llevar el historial."}
          </p>
          {!q && (
            <Link href="/pacientes/nuevo" className="btn-primary">
              <Plus size={18} strokeWidth={1.75} aria-hidden="true" />
              Registrar paciente
            </Link>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {pacientes?.map((p) => (
          <Link key={p.id} href={`/pacientes/${p.id}`} className="list-row">
            <UserRound
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
              className="text-muted"
            />
            <div className="list-row-main">
              <span className="list-row-title">{p.nombre}</span>
              <span className="list-row-meta">
                {p.telefono || (p.documento ? `CC ${p.documento}` : "Sin teléfono")}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
