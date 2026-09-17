"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function CerrarSesionBoton() {
  const router = useRouter();

  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={salir}
      className="icon-btn"
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
    >
      <LogOut strokeWidth={1.75} size={18} />
    </button>
  );
}
