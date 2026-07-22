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

  // Protección: si configuras CRON_SECRET, Vercel Cron envía este header
  // automáticamente. El modo de prueba (?test=1) la salta a propósito para
  // que puedas dispararla tú mismo desde el navegador mientras pruebas.
  const secret = process.env.CRON_SECRET;
  if (secret && !esPrueba) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return new Response("No autorizado", { status: 401 });
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: subs } = await supabase.from("push_subscriptions").select("*");

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

    const alertas = (gruas || [])
      .map((g) => {
        const ultimaItv = (itvs || []).find((i) => i.grua_id === g.id);
        if (!ultimaItv) return null;
        const dias = diasHasta(ultimaItv.proxima_fecha);
        if (dias < 0 || dias > 7) return null;
        return { ...g, proximaItv: ultimaItv.proxima_fecha, dias };
      })
      .filter(Boolean);

    if (alertas.length === 0 || !subs || subs.length === 0) {
      return Response.json({ ok: true, avisos: 0, dispositivos: subs?.length || 0 });
    }

    const cuerpo =
      alertas.length === 1
        ? `${alertas[0].matricula} (${alertas[0].marca}) — ITV el ${new Date(
            alertas[0].proximaItv
          ).toLocaleDateString("es-ES")}`
        : `${alertas.length} grúas con ITV próxima: ${alertas
            .map((a) => a.matricula)
            .join(", ")}`;

    payload = JSON.stringify({
      title: "⚠️ ITV próxima a vencer",
      body: cuerpo,
      url: "/",
    });
  }

  if (!subs || subs.length === 0) {
    return Response.json({ ok: true, enviados: 0, motivo: "No hay dispositivos activados todavía" });
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

  return Response.json({ ok: true, prueba: esPrueba, enviados, detalles });
}
