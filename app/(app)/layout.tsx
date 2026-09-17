import { getPerfilActual } from "@/lib/data/perfil";
import { NavLinks } from "./nav-links";
import { CerrarSesionBoton } from "./cerrar-sesion-boton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const perfil = await getPerfilActual();

  return (
    <div className="app-shell has-bottom-nav">
      <header className="app-header">
        <span className="font-display text-lg text-default">Sabanaderma</span>
        <nav className="hidden md:flex items-center gap-1 ml-4">
          <NavLinks esDueno={perfil?.role === "dueno"} />
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {perfil && <span className="text-sm text-muted">{perfil.nombre}</span>}
          <CerrarSesionBoton />
        </div>
      </header>

      <main className="page">{children}</main>

      <nav className="bottom-nav md:hidden">
        <NavLinks esDueno={perfil?.role === "dueno"} soloIconos />
      </nav>
    </div>
  );
}
