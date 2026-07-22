import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import Navigation from "./src/navigation";
import { registrarNotificaciones } from "./src/services/notifications";

export default function App() {
  useEffect(() => {
    registrarNotificaciones();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Navigation />
    </>
  );
}
