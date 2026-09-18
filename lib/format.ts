// Moneda del proyecto: peso colombiano (COP). "es-CO" agrupa miles con
// punto (1.234.567), que es como se lee normalmente en Colombia — "es-MX"
// (que se usaba antes) agrupa con coma y queda mal para COP.
export function formatCOP(monto: number): string {
  return `$${monto.toLocaleString("es-CO")} COP`;
}

export function formatFechaCO(fecha: string | Date): string {
  return new Date(fecha).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
