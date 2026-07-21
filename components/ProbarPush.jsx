"use client";

import { useEffect, useRef, useState } from "react";

export default function ProbarPush() {
  const [enviando, setEnviando] = useState(false);
  const [ultimoResultado, setUltimoResultado] = useState(null);
  const [repitiendo, setRepitiendo] = useState(false);
  const intervaloRef = useRef(null);

  async function enviarPrueba() {
    setEnviando(true);
    try {
      const res = await fetch("/api/check-itv?test=1");
      const data = await res.json();
      setUltimoResultado({ hora: new Date().toLocaleTimeString("es-ES"), ...data });
    } catch (e) {
      setUltimoResultado({ hora: new Date().toLocaleTimeString("es-ES"), error: true });
    }
    setEnviando(false);
  }

  function alternarRepeticion() {
    if (repitiendo) {
      clearInterval(intervaloRef.current);
      setRepitiendo(false);
    } else {
      enviarPrueba();
      intervaloRef.current = setInterval(enviarPrueba, 60 * 1000);
      setRepitiendo(true);
    }
  }

  useEffect(() => {
    return () => clearInterval(intervaloRef.current);
  }, []);

  return (
    <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 mb-6">
      <p className="text-sm font-medium text-gray-700 mb-2">
        🧪 Modo de prueba (quita esto cuando ya esté todo probado)
      </p>
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={enviarPrueba}
          disabled={enviando}
          className="bg-gray-700 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
        >
          {enviando ? "Enviando..." : "Probar ahora"}
        </button>
        <button
          onClick={alternarRepeticion}
          className={`text-sm px-3 py-1.5 rounded-lg transition ${
            repitiendo
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          {repitiendo ? "Detener repetición" : "Repetir cada minuto"}
        </button>
        {ultimoResultado && (
          <span className="text-xs text-gray-500">
            Última prueba: {ultimoResultado.hora} —{" "}
            {ultimoResultado.error
              ? "error"
              : `${ultimoResultado.enviados ?? 0} dispositivo(s)`}
          </span>
        )}
      </div>
      {repitiendo && (
        <p className="text-xs text-amber-600 mt-2">
          Se está enviando cada minuto mientras esta pestaña siga abierta. Recuerda pulsar "Detener repetición".
        </p>
      )}
    </div>
  );
}
