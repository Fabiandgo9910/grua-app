"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function guardarSuscripcion(sub) {
  const json = sub.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) {
    console.error("Error guardando la suscripción en Supabase:", error.message);
    return false;
  }
  return true;
}

export default function ActivarPush() {
  const [estado, setEstado] = useState("comprobando"); // comprobando | inactivo | activo | no-soportado

  useEffect(() => {
    comprobarEstado();
  }, []);

  async function comprobarEstado() {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setEstado("no-soportado");
      return;
    }
    const reg = await navigator.serviceWorker.register("/sw.js");
    const sub = await reg.pushManager.getSubscription();

    if (sub && Notification.permission === "granted") {
      // Ya había una suscripción local: la volvemos a guardar SIEMPRE en
      // Supabase por si se había borrado ahí (desincronización cliente/servidor).
      const ok = await guardarSuscripcion(sub);
      setEstado(ok ? "activo" : "inactivo");
    } else {
      setEstado("inactivo");
    }
  }

  async function activar() {
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") return;

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          ),
        });
      }

      const ok = await guardarSuscripcion(sub);
      setEstado(ok ? "activo" : "inactivo");
    } catch (e) {
      console.error("Error activando notificaciones push:", e);
      setEstado("inactivo");
    }
  }

  if (estado === "no-soportado" || estado === "activo" || estado === "comprobando") {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 mb-6 flex items-center justify-between gap-3">
      <p className="text-sm">
        Activa las notificaciones push para el aviso de la ITV (funciona aunque cierres la app).
      </p>
      <button
        onClick={activar}
        className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
      >
        Activar
      </button>
    </div>
  );
}
