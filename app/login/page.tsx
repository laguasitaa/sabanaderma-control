"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState<"entrar" | "crear">("entrar");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const supabase = createClient();

    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("Correo o contraseña incorrectos.");
        setCargando(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre } },
      });
      if (error) {
        setError(
          error.message.includes("already registered")
            ? "Ya existe una cuenta con ese correo. Intenta entrar."
            : "No se pudo crear la cuenta. Intenta de nuevo.",
        );
        setCargando(false);
        return;
      }
    }

    router.push("/pacientes");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4">
      <div className="card w-full max-w-sm">
        <h1 className="font-display text-2xl text-default mb-1">Sabanaderma Control</h1>
        <p className="text-muted text-sm mb-6">
          {modo === "entrar" ? "Entra a tu cuenta" : "Crea tu cuenta de la clínica"}
        </p>

        <div className="segmented mb-6">
          <button
            type="button"
            className="segment"
            aria-selected={modo === "entrar"}
            onClick={() => setModo("entrar")}
          >
            Entrar
          </button>
          <button
            type="button"
            className="segment"
            aria-selected={modo === "crear"}
            onClick={() => setModo("crear")}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {modo === "crear" && (
            <div>
              <label className="label-default block mb-1" htmlFor="nombre">
                Tu nombre
              </label>
              <input
                id="nombre"
                className="input-default w-full"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="label-default block mb-1" htmlFor="email">
              Correo
            </label>
            <input
              id="email"
              type="email"
              className="input-default w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label-default block mb-1" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className="input-default w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={cargando}>
            {cargando ? "Un momento…" : modo === "entrar" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
