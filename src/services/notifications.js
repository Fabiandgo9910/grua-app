import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "../lib/supabase";

// Cómo se muestran las notis cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Pide permiso, obtiene el token push del dispositivo
 * y lo guarda en la tabla push_tokens de Supabase.
 * Llamar una vez al abrir la app (ver App.js).
 */
export async function registrarNotificaciones() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2563eb",
    });
  }

  if (!Device.isDevice) {
    console.log("Las notificaciones push solo funcionan en dispositivo real");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Permiso de notificaciones denegado");
    return null;
  }

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenData.data;

  // Guardamos el token (upsert para no duplicar)
  await supabase.from("push_tokens").upsert({ token }, { onConflict: "token" });

  return token;
}

/**
 * Suscripción en tiempo real: se ejecuta callback cada vez
 * que hay un cambio en la tabla indicada (insert/update/delete).
 */
export function suscribirCambiosRealtime(tabla, callback) {
  const canal = supabase
    .channel(`realtime:${tabla}`)
    .on("postgres_changes", { event: "*", schema: "public", table: tabla }, callback)
    .subscribe();

  return () => supabase.removeChannel(canal);
}
