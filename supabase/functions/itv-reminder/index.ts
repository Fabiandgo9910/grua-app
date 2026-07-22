// Función programada (Supabase Edge Function) que se ejecuta 1 vez al día.
// Busca ITVs que vencen en exactamente 7 días y manda una notificación push
// a todos los dispositivos registrados, usando el servicio push de Expo.
//
// Despliegue: ver README.md, sección "Notificaciones automáticas de ITV".

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const hoy = new Date();
  const en7dias = new Date(hoy);
  en7dias.setDate(hoy.getDate() + 7);
  const fechaObjetivo = en7dias.toISOString().slice(0, 10);

  const { data: itvsProximas, error } = await supabase
    .from("itv")
    .select("id, proxima_fecha, grua_id, gruas(matricula), avisada")
    .eq("proxima_fecha", fechaObjetivo)
    .eq("avisada", false);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!itvsProximas || itvsProximas.length === 0) {
    return new Response(JSON.stringify({ mensaje: "Sin ITVs que avisar hoy" }));
  }

  const { data: tokens } = await supabase.from("push_tokens").select("token");
  const expoTokens = (tokens || []).map((t) => t.token);

  for (const itv of itvsProximas) {
    const matricula = itv.gruas?.matricula ?? "grúa";
    const mensajes = expoTokens.map((to) => ({
      to,
      sound: "default",
      title: "ITV próxima a caducar",
      body: `La grúa ${matricula} debe pasar la ITV el ${itv.proxima_fecha} (quedan 7 días).`,
    }));

    if (mensajes.length > 0) {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mensajes),
      });
    }

    await supabase.from("itv").update({ avisada: true }).eq("id", itv.id);
  }

  return new Response(JSON.stringify({ avisadas: itvsProximas.length }));
});
