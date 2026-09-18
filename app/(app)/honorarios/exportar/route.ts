import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPerfilActual } from "@/lib/data/perfil";

type Fila = {
  created_at: string;
  precio_cobrado: number;
  importado_historico: boolean;
  procedimiento_texto_historico: string | null;
  forma_pago: string | null;
  nota_seguimiento: string | null;
  pacientes: { nombre: string; documento: string | null; telefono: string | null } | null;
  tipos_procedimiento: { nombre: string } | null;
  doctoras: { nombre: string } | null;
  honorarios: { monto: number } | null;
};

// Excel en configuración regional colombiana espera ";" como separador de
// columnas en un CSV (porque usa "," como separador decimal) — con "," como
// separador de columnas, Excel-CO no separa bien las celdas.
function csvEscape(valor: string): string {
  if (valor.includes(";") || valor.includes('"') || valor.includes("\n")) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export async function GET() {
  const perfil = await getPerfilActual();

  if (perfil?.role !== "dueno") {
    return NextResponse.json(
      { error: "Solo el dueño puede exportar los honorarios y reportes de dinero." },
      { status: 403 },
    );
  }

  const supabase = await createClient();

  // Supabase/PostgREST devuelve como máximo 1000 filas por consulta — hay
  // que pedirlas por páginas o el export queda incompleto en silencio.
  const TAMANO_PAGINA = 1000;
  const registros: Fila[] = [];
  for (let desde = 0; ; desde += TAMANO_PAGINA) {
    const { data, error } = await supabase
      .from("registros_uso")
      .select(
        `created_at, precio_cobrado, importado_historico, procedimiento_texto_historico, forma_pago, nota_seguimiento,
         pacientes(nombre, documento, telefono),
         tipos_procedimiento(nombre),
         doctoras(nombre),
         honorarios(monto)`,
      )
      .order("created_at", { ascending: true })
      .range(desde, desde + TAMANO_PAGINA - 1)
      .returns<Fila[]>();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    registros.push(...data);
    if (data.length < TAMANO_PAGINA) break;
  }

  const encabezados = [
    "Fecha",
    "Paciente",
    "Documento",
    "Teléfono",
    "Procedimiento",
    "Doctora",
    "Precio cobrado (COP)",
    "Honorario (COP)",
    "Forma de pago",
    "Nota de seguimiento",
    "Importado del histórico",
  ];

  const filas = registros.map((r) => [
    r.created_at.slice(0, 10),
    r.pacientes?.nombre ?? "",
    r.pacientes?.documento ?? "",
    r.pacientes?.telefono ?? "",
    r.tipos_procedimiento?.nombre ?? r.procedimiento_texto_historico ?? "",
    r.doctoras?.nombre ?? "",
    String(r.precio_cobrado),
    r.honorarios ? String(r.honorarios.monto) : "",
    r.forma_pago ?? "",
    r.nota_seguimiento ?? "",
    r.importado_historico ? "Sí" : "No",
  ]);

  const lineas = [encabezados, ...filas].map((fila) => fila.map(csvEscape).join(";"));
  // BOM al inicio: sin esto, Excel muestra mal las tildes y la "ñ".
  const csv = "﻿" + lineas.join("\r\n");

  const fecha = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sabanaderma-honorarios-${fecha}.csv"`,
    },
  });
}
