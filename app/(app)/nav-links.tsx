"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Package, Stethoscope, Wallet, BarChart3 } from "lucide-react";

const destinos = [
  { href: "/pacientes", label: "Pacientes", icon: Users, soloDueno: false },
  { href: "/insumos", label: "Insumos", icon: Package, soloDueno: false },
  { href: "/procedimientos", label: "Procedimientos", icon: Stethoscope, soloDueno: false },
  { href: "/indicadores", label: "Indicadores", icon: BarChart3, soloDueno: false },
  { href: "/honorarios", label: "Honorarios", icon: Wallet, soloDueno: true },
];

export function NavLinks({
  esDueno,
  soloIconos = false,
}: {
  esDueno: boolean;
  soloIconos?: boolean;
}) {
  const pathname = usePathname();

  return (
    <>
      {destinos
        .filter((d) => !d.soloDueno || esDueno)
        .map((d) => {
          const activo = pathname.startsWith(d.href);
          const Icon = d.icon;

          if (soloIconos) {
            return (
              <Link
                key={d.href}
                href={d.href}
                className="nav-item"
                aria-current={activo ? "page" : undefined}
              >
                <Icon strokeWidth={1.75} aria-hidden="true" />
                {d.label}
              </Link>
            );
          }

          return (
            <Link
              key={d.href}
              href={d.href}
              className="text-sm font-semibold px-3 py-2 rounded-md transition-colors"
              style={{
                color: activo ? "var(--c-accent)" : "var(--c-text-muted)",
              }}
            >
              {d.label}
            </Link>
          );
        })}
    </>
  );
}
