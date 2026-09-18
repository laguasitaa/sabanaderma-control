"use server";

import { createClient } from "@/lib/supabase/server";

export async function buscarPosiblesDuplicados(nombre: string, telefono: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pacientes")
    .select("id, nombre, telefono, documento")
    .or(`telefono.eq.${telefono},nombre.ilike.%${nombre}%`)
    .limit(5);

  if (error) throw new Error(error.message);
  return data;
}

export async function crearPaciente(nombre: string, telefono: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase
    .from("pacientes")
    .insert({ nombre, telefono, created_by: user.id })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}
