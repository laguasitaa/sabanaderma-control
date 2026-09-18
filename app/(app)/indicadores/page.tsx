import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/format";

type Fila = {
  created_at: string;
  precio_cobrado: number;
  tipos_procedimiento: { nombre: string } | null;
  procedimiento_texto_historico: string | null;
};

const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export default async function IndicadoresPage() {
  const supabase = await createClient();

  // Igual que en Honorarios: PostgREST devuelve máximo 1000 filas por
  // consulta, así que hay que pedirlas por páginas para que los totales
  // sean correctos con miles de registros.
  const TAMANO_PAGINA = 1000;
  const registros: Fila[] = [];
  for (let desde = 0; ; desde += TAMANO_PAGINA) {
    const { data, error } = await supabase
      .from("registros_uso")
      .select("created_at, precio_cobrado, tipos_procedimiento(nombre), procedimiento_texto_historico")
      .range(desde, desde + TAMANO_PAGINA - 1)
      .returns<Fila[]>();

    if (error) break;
    registros.push(...data);
    if (data.length < TAMANO_PAGINA) break;
  }

  const totalIngresos = registros.reduce((acc, r) => acc + r.precio_cobrado, 0);
  const totalProcedimientos = registros.length;
  const promedioPorProcedimiento = totalProcedimientos > 0 ? totalIngresos / totalProcedimientos : 0;

  // Últimos 12 meses con datos.
  const porMes = new Map<string, { ingresos: number; conteo: number }>();
  for (const r of registros) {
    const clave = r.created_at.slice(0, 7); // "YYYY-MM"
    const actual = porMes.get(clave) ?? { ingresos: 0, conteo: 0 };
    actual.ingresos += r.precio_cobrado;
    actual.conteo += 1;
    porMes.set(clave, actual);
  }
  const mesesOrdenados = [...porMes.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12);

  // Procedimientos más frecuentes.
  const porProcedimiento = new Map<string, { ingresos: number; conteo: number }>();
  for (const r of registros) {
    const nombre = r.tipos_procedimiento?.nombre ?? r.procedimiento_texto_historico ?? "Sin nombre";
    const actual = porProcedimiento.get(nombre) ?? { ingresos: 0, conteo: 0 };
    actual.ingresos += r.precio_cobrado;
    actual.conteo += 1;
    porProcedimiento.set(nombre, actual);
  }
  const topProcedimientos = [...porProcedimiento.entries()]
    .sort((a, b) => b[1].conteo - a[1].conteo)
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl text-default">Indicadores</h1>

      <div className="flex flex-wrap gap-4">
        <div className="card">
          <p className="text-muted text-sm">Ingresos totales</p>
          <p className="font-display text-2xl text-default num">{formatCOP(totalIngresos)}</p>
        </div>
        <div className="card">
          <p className="text-muted text-sm">Procedimientos registrados</p>
          <p className="font-display text-2xl text-default num">
            {totalProcedimientos.toLocaleString("es-CO")}
          </p>
        </div>
        <div className="card">
          <p className="text-muted text-sm">Ingreso promedio por procedimiento</p>
          <p className="font-display text-2xl text-default num">
            {formatCOP(promedioPorProcedimiento)}
          </p>
        </div>
      </div>

      <div className="card">
        <p className="font-display text-lg text-default mb-2">Últimos 12 meses</p>
        <div className="flex flex-col gap-2">
          {mesesOrdenados.map(([clave, datos]) => {
            const [anio, mes] = clave.split("-");
            const nombreMes = MESES[Number(mes) - 1];
            return (
              <div key={clave} className="flex items-center justify-between">
                <span className="text-default text-sm">
                  {nombreMes} {anio} · {datos.conteo} procedimientos
                </span>
                <span className="num text-default font-semibold">{formatCOP(datos.ingresos)}</span>
              </div>
            );
          })}
          {mesesOrdenados.length === 0 && (
            <p className="text-muted text-sm">Todavía no hay procedimientos registrados.</p>
          )}
        </div>
      </div>

      <div className="card">
        <p className="font-display text-lg text-default mb-2">Procedimientos más frecuentes</p>
        <div className="flex flex-col gap-2">
          {topProcedimientos.map(([nombre, datos]) => (
            <div key={nombre} className="flex items-center justify-between gap-3">
              <span className="text-default text-sm">
                {nombre} · {datos.conteo} veces
              </span>
              <span className="num text-default font-semibold">{formatCOP(datos.ingresos)}</span>
            </div>
          ))}
          {topProcedimientos.length === 0 && (
            <p className="text-muted text-sm">Todavía no hay procedimientos registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
}
