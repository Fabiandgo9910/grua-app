import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const dynamic = "force-dynamic";

webpush.setVapidDetails(
  "mailto:soporte@ejemplo.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

function diasHasta(fecha) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fecha);
  f.setHours(0, 0, 0, 0);
  return Math.round((f - hoy) / (1000 * 60 * 60 * 24));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const esPrueba = searchParams.get("test") === "1";
  const esDiag = searchParams.get("diag") === "1";
  const esManual = searchParams.get("manual") === "1";
  const VERSION = "v4-tacografo";

  const jsonSinCache = (body, status = 200) =>
    Response.json(body, {
      status,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });

  // Protección: si configuras CRON_SECRET, Vercel Cron envía este header
  // automáticamente. El modo de prueba (?test=1), diagnóstico (?diag=1) y
  // manual (?manual=1) lo saltan a propósito para que puedas usarlos tú
  // mismo desde el navegador.
  const secret = process.env.CRON_SECRET;
  if (secret && !esPrueba && !esDiag && !esManual) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return jsonSinCache({ version: VERSION, error: "No autorizado" }, 401);
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        // Evita que Next.js cachee las peticiones que hace supabase-js por debajo.
        fetch: (url, options = {}) => fetch(url, { ...options, cache: "no-store" }),
      },
    }
  );

  // Modo diagnóstico: ?diag=1 — confirma variables de entorno y suscripciones,
  // sin enviar ningún push.
  if (searchParams.get("diag") === "1") {
    const { data: subs, error } = await supabase.from("push_subscriptions").select("id, created_at");
    return jsonSinCache({
      version: VERSION,
      variables_de_entorno: {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY: !!process.env.VAPID_PRIVATE_KEY,
        CRON_SECRET: !!process.env.CRON_SECRET,
      },
      total_suscripciones: subs?.length ?? null,
      suscripciones: subs,
      error_supabase: error?.message || null,
    });
  }

  const { data: subs, error: errorSubs } = await supabase.from("push_subscriptions").select("*");

  let payload;

  if (esPrueba) {
    // Modo de prueba: ignora fechas, manda siempre un aviso de prueba
    // a todos los dispositivos activados, para comprobar que el push llega.
    payload = JSON.stringify({
      title: "🔔 Notificación de prueba",
      body: `Prueba enviada a las ${new Date().toLocaleTimeString("es-ES")}`,
      url: "/",
    });
  } else {
    const { data: gruas } = await supabase.from("gruas").select("*");
    const { data: itvs } = await supabase
      .from("itv_historial")
      .select("*")
      .order("proxima_fecha", { ascending: false });
    const { data: tacografos } = await supabase
      .from("tacografo_historial")
      .select("*")
      .order("proxima_fecha", { ascending: false });

    const alertasItv = (gruas || [])
      .map((g) => {
        const ultimaItv = (itvs || []).find((i) => i.grua_id === g.id);
        if (!ultimaItv) return null;
        const dias = diasHasta(ultimaItv.proxima_fecha);
        if (dias < 0 || dias > 7) return null;
        return { ...g, proximaFecha: ultimaItv.proxima_fecha, tipo: "ITV" };
      })
      .filter(Boolean);

    const alertasTacografo = (gruas || [])
      .map((g) => {
        const ultimo = (tacografos || []).find((t) => t.grua_id === g.id);
        if (!ultimo) return null;
        const dias = diasHasta(ultimo.proxima_fecha);
        if (dias < 0 || dias > 7) return null;
        return { ...g, proximaFecha: ultimo.proxima_fecha, tipo: "Tacógrafo" };
      })
      .filter(Boolean);

    const alertas = [...alertasItv, ...alertasTacografo];

    if (alertas.length === 0 || !subs || subs.length === 0) {
      return jsonSinCache({ version: VERSION, ok: true, avisos: 0, dispositivos: subs?.length || 0 });
    }

    const cuerpo =
      alertas.length === 1
        ? `${alertas[0].matricula} (${alertas[0].marca}) — ${alertas[0].tipo} el ${new Date(
            alertas[0].proximaFecha
          ).toLocaleDateString("es-ES")}`
        : `${alertas.length} avisos próximos: ${alertas
            .map((a) => `${a.matricula} (${a.tipo})`)
            .join(", ")}`;

    payload = JSON.stringify({
      title: "⚠️ ITV / Tacógrafo próximo a vencer",
      body: cuerpo,
      url: "/",
    });
  }

  if (!subs || subs.length === 0) {
    return jsonSinCache({
      version: VERSION,
      ok: true,
      enviados: 0,
      motivo: "No hay dispositivos activados todavía",
      error_real: errorSubs?.message || null,
    });
  }

  let enviados = 0;
  const detalles = [];
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
      enviados++;
      detalles.push({ id: sub.id, ok: true });
    } catch (err) {
      detalles.push({
        id: sub.id,
        ok: false,
        statusCode: err.statusCode || null,
        mensaje: err.message,
        body: err.body || null,
      });
      // Si la suscripción ya no es válida (410/404), la borramos.
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      } else {
        console.error("Error enviando push:", err.message);
      }
    }
  }

  return jsonSinCache({ version: VERSION, ok: true, prueba: esPrueba, enviados, detalles });
}
