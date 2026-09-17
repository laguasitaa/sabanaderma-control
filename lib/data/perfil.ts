import { createClient } from "@/lib/supabase/server";

export type Perfil = {
  id: string;
  nombre: string;
  role: "dueno" | "personal";
};

export async function getPerfilActual(): Promise<Perfil | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, nombre, role")
    .eq("id", user.id)
    .single();

  return data as Perfil | null;
}
