"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import GruaCard from "@/components/GruaCard";
import { IconoPlataformaGrua } from "@/components/icons";
import ActivarPush from "@/components/ActivarPush";
import ProbarPush from "@/components/ProbarPush";
import { alertasHoy } from "@/lib/notificaciones";
import Image from 'next/image';

function normalizar(texto) {
  return (texto || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // quita acentos
}

export default function Dashboard() {
  const [gruas, setGruas] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [soloItv, setSoloItv] = useState(false);

  const fetchGruas = useCallback(async () => {
    const { data: gruasData } = await supabase
      .from("gruas")
      .select("*")
      .order("matricula");

    const { data: itvData } = await supabase
      .from("itv_historial")
      .select("*")
      .order("proxima_fecha", { ascending: false });

    const gruasConItv = (gruasData || []).map((g) => {
      const itvs = (itvData || []).filter((i) => i.grua_id === g.id);
      const ultimaItv = itvs[0];
      return { ...g, proximaItv: ultimaItv?.proxima_fecha ?? null };
    });

    setGruas(gruasConItv);
    setAlertas(alertasHoy(gruasConItv));
    setCargando(false);
  }, []);

  useEffect(() => {
    fetchGruas();

    // Suscripción en tiempo real: cualquier cambio en estas tablas
    // refresca el dashboard al instante en todos los dispositivos abiertos.
    const channel = supabase
      .channel("realtime-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "gruas" }, fetchGruas)
      .on("postgres_changes", { event: "*", schema: "public", table: "itv_historial" }, fetchGruas)
      .on("postgres_changes", { event: "*", schema: "public", table: "historial_taller" }, fetchGruas)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGruas]);

  const idsConItvProxima = useMemo(() => new Set(alertas.map((a) => a.id)), [alertas]);

  const gruasFiltradas = useMemo(() => {
    let lista = gruas;

    if (soloItv) {
      lista = lista.filter((g) => idsConItvProxima.has(g.id));
    }

    const termino = normalizar(busqueda).trim();
    if (termino) {
      const palabras = termino.split(/\s+/);
      lista = lista.filter((g) => {
        const texto = normalizar(
          [g.matricula, g.marca, g.modelo, g.codigo, g.tipo].filter(Boolean).join(" ")
        );
        // coincide si TODAS las palabras buscadas aparecen (aunque sea parcialmente)
        return palabras.every((p) => texto.includes(p));
      });
    }

    return lista;
  }, [gruas, busqueda, soloItv, idsConItvProxima]);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Image 
            src="/ICON-192.png"
            alt="Logo"
            width="192"
            height="192"
            className="w-8 h-8"
          />
          Asistencia del Toro
          </h1>
          <Link
            href="/gruas/nueva"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm md:text-base"
          >
            + Nueva Grúa
          </Link>
        </div>

        <ActivarPush />
        {/* <ProbarPush /> */}

        {alertas.length > 0 && (
          <div className="bg-amber-100 border border-amber-400 text-amber-800 rounded-lg p-4 mb-6">
            <p className="font-semibold mb-1">⚠️ ITV próxima a vencer (7 días o menos):</p>
            <ul className="text-sm space-y-1">
              {alertas.map((g) => (
                <li key={g.id}>
                  {g.matricula} ({g.marca}) — ITV el{" "}
                  {new Date(g.proximaItv).toLocaleDateString("es-ES")}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por matrícula, marca, modelo, código o tipo..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setSoloItv((v) => !v)}
            className={`text-sm px-4 py-2 rounded-lg transition whitespace-nowrap ${
              soloItv
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            ⚠️ Solo con ITV próxima
          </button>
        </div>

        {cargando && <p className="text-gray-500">Cargando grúas...</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gruasFiltradas.map((g) => (
            <GruaCard key={g.id} grua={g} />
          ))}
        </div>

        {!cargando && gruas.length === 0 && (
          <p className="text-center text-gray-500 mt-12">
            No hay grúas registradas todavía. Crea la primera con el botón de arriba.
          </p>
        )}

        {!cargando && gruas.length > 0 && gruasFiltradas.length === 0 && (
          <p className="text-center text-gray-500 mt-12">
            Ninguna grúa coincide con la búsqueda o el filtro aplicado.
          </p>
        )}
      </div>
    </main>
  );
}
