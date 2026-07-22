import { supabase } from "../lib/supabase";

/* ---------- GRÚAS ---------- */

export async function listarGruas() {
  const { data, error } = await supabase
    .from("gruas")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function obtenerGrua(id) {
  const { data, error } = await supabase.from("gruas").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function crearGrua(grua) {
  const { data, error } = await supabase.from("gruas").insert(grua).select().single();
  if (error) throw error;
  return data;
}

export async function actualizarGrua(id, cambios) {
  const { data, error } = await supabase
    .from("gruas")
    .update(cambios)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function eliminarGrua(id) {
  const { error } = await supabase.from("gruas").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- HISTORIAL (mantenimiento / rotura) ---------- */

export async function listarHistorial(gruaId) {
  const { data, error } = await supabase
    .from("historial")
    .select("*")
    .eq("grua_id", gruaId)
    .order("fecha", { ascending: false });
  if (error) throw error;
  return data;
}

export async function crearHistorial({ grua_id, tipo, observacion, fecha }) {
  const { data, error } = await supabase
    .from("historial")
    .insert({ grua_id, tipo, observacion, fecha })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function eliminarHistorial(id) {
  const { error } = await supabase.from("historial").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- ITV ---------- */

export async function listarITV(gruaId) {
  const { data, error } = await supabase
    .from("itv")
    .select("*")
    .eq("grua_id", gruaId)
    .order("fecha", { ascending: false });
  if (error) throw error;
  return data;
}

export async function crearITV({ grua_id, fecha, proxima_fecha }) {
  const { data, error } = await supabase
    .from("itv")
    .insert({ grua_id, fecha, proxima_fecha })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function proximaITVDeGrua(gruaId) {
  const { data, error } = await supabase
    .from("itv")
    .select("*")
    .eq("grua_id", gruaId)
    .order("proxima_fecha", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
