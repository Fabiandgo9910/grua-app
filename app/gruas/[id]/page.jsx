"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TIPOS } from "@/components/GruaCard";

export default function FichaGrua() {
  const { id } = useParams();
  const router = useRouter();

  const [grua, setGrua] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [itvs, setItvs] = useState([]);
  const [tab, setTab] = useState("datos");
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState(null);

  const cargarTodo = useCallback(async () => {
    const { data: g } = await supabase.from("gruas").select("*").eq("id", id).single();
    const { data: h } = await supabase
      .from("historial_taller")
      .select("*")
      .eq("grua_id", id)
      .order("fecha", { ascending: false });
    const { data: i } = await supabase
      .from("itv_historial")
      .select("*")
      .eq("grua_id", id)
      .order("fecha", { ascending: false });

    setGrua(g);
    setForm(g);
    setHistorial(h || []);
    setItvs(i || []);
  }, [id]);

  useEffect(() => {
    cargarTodo();
    const channel = supabase
      .channel(`realtime-grua-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "gruas", filter: `id=eq.${id}` }, cargarTodo)
      .on("postgres_changes", { event: "*", schema: "public", table: "historial_taller", filter: `grua_id=eq.${id}` }, cargarTodo)
      .on("postgres_changes", { event: "*", schema: "public", table: "itv_historial", filter: `grua_id=eq.${id}` }, cargarTodo)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [id, cargarTodo]);

  async function guardarDatos(e) {
    e.preventDefault();
    await supabase
      .from("gruas")
      .update({
        matricula: form.matricula,
        marca: form.marca,
        tipo: form.tipo,
        codigo: form.codigo,
      })
      .eq("id", id);
    setEditando(false);
  }

  async function eliminarGrua() {
    if (!confirm("¿Seguro que quieres eliminar esta grúa y todo su historial?")) return;
    await supabase.from("gruas").delete().eq("id", id);
    router.push("/");
  }

  if (!grua) {
    return <main className="p-8 text-gray-500">Cargando...</main>;
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.push("/")} className="text-sm text-blue-600 mb-4">
          ← Volver
        </button>

        <div className="bg-white rounded-xl shadow p-6 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{grua.matricula}</h1>
              <p className="text-gray-500">{grua.marca} — {TIPOS[grua.tipo]}</p>
              <p className="text-xs text-gray-400">Código: {grua.codigo}</p>
            </div>
            <button
              onClick={eliminarGrua}
              className="text-red-600 text-sm hover:underline"
            >
              Eliminar grúa
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-200">
          {[
            { key: "datos", label: "Datos" },
            { key: "historial", label: "Mantenimiento / Roturas" },
            { key: "itv", label: "ITV" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === t.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "datos" && (
          <div className="bg-white rounded-xl shadow p-6">
            {!editando ? (
              <div className="space-y-2">
                <Campo label="Matrícula" valor={grua.matricula} />
                <Campo label="Marca" valor={grua.marca} />
                <Campo label="Tipo" valor={TIPOS[grua.tipo]} />
                <Campo label="Código" valor={grua.codigo} />
                <button
                  onClick={() => setEditando(true)}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  Editar datos
                </button>
              </div>
            ) : (
              <form onSubmit={guardarDatos} className="space-y-4">
                <Input label="Matrícula" value={form.matricula} onChange={(v) => setForm({ ...form, matricula: v })} />
                <Input label="Marca" value={form.marca} onChange={(v) => setForm({ ...form, marca: v })} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {Object.entries(TIPOS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <Input label="Código" value={form.codigo} onChange={(v) => setForm({ ...form, codigo: v })} />
                <div className="flex gap-2">
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => { setForm(grua); setEditando(false); }}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {tab === "historial" && <HistorialTaller gruaId={id} historial={historial} />}

        {tab === "itv" && <ControlItv gruaId={id} itvs={itvs} />}
      </div>
    </main>
  );
}

function Campo({ label, valor }) {
  return (
    <p className="text-sm">
      <span className="text-gray-400">{label}: </span>
      <span className="text-gray-800 font-medium">{valor}</span>
    </p>
  );
}

function Input({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function HistorialTaller({ gruaId, historial }) {
  const [tipo, setTipo] = useState("mantenimiento");
  const [observacion, setObservacion] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));

  async function agregar(e) {
    e.preventDefault();
    await supabase.from("historial_taller").insert([
      { grua_id: gruaId, tipo, observacion, fecha },
    ]);
    setObservacion("");
  }

  async function eliminar(idRegistro) {
    await supabase.from("historial_taller").delete().eq("id", idRegistro);
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <form onSubmit={agregar} className="space-y-3 mb-6 border-b border-gray-100 pb-6">
        <div className="flex gap-2">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="mantenimiento">Mantenimiento</option>
            <option value="rotura">Rotura</option>
          </select>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <textarea
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          placeholder="¿Qué se hizo?"
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          rows={2}
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
          Añadir registro
        </button>
      </form>

      <ul className="space-y-3">
        {historial.map((h) => (
          <li key={h.id} className="flex justify-between items-start border border-gray-100 rounded-lg p-3">
            <div>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  h.tipo === "rotura" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                }`}
              >
                {h.tipo === "rotura" ? "Rotura" : "Mantenimiento"}
              </span>
              <p className="text-sm mt-1">{h.observacion}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(h.fecha).toLocaleDateString("es-ES")}
              </p>
            </div>
            <button onClick={() => eliminar(h.id)} className="text-xs text-gray-400 hover:text-red-600">
              Eliminar
            </button>
          </li>
        ))}
        {historial.length === 0 && (
          <p className="text-sm text-gray-400">Sin registros todavía.</p>
        )}
      </ul>
    </div>
  );
}

function ControlItv({ gruaId, itvs }) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [proximaFecha, setProximaFecha] = useState("");

  async function agregar(e) {
    e.preventDefault();
    await supabase.from("itv_historial").insert([
      { grua_id: gruaId, fecha, proxima_fecha: proximaFecha },
    ]);

    // Si la ITV que se acaba de registrar ya está a 7 días o menos,
    // avisa a todos los dispositivos ahora mismo, sin esperar al cron diario.
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const objetivo = new Date(proximaFecha);
    objetivo.setHours(0, 0, 0, 0);
    const dias = Math.round((objetivo - hoy) / (1000 * 60 * 60 * 24));

    if (dias >= 0 && dias <= 7) {
      fetch("/api/check-itv?manual=1").catch((err) =>
        console.error("No se pudo disparar el aviso inmediato:", err)
      );
    }

    setProximaFecha("");
  }

  async function eliminar(id) {
    await supabase.from("itv_historial").delete().eq("id", id);
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <form onSubmit={agregar} className="space-y-3 mb-6 border-b border-gray-100 pb-6">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha en la que se pasó la ITV</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha de la próxima ITV</label>
          <input
            type="date"
            value={proximaFecha}
            onChange={(e) => setProximaFecha(e.target.value)}
            required
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
          Registrar ITV
        </button>
      </form>

      <ul className="space-y-3">
        {itvs.map((i) => (
          <li key={i.id} className="flex justify-between items-start border border-gray-100 rounded-lg p-3">
            <div>
              <p className="text-sm">
                Pasada el <b>{new Date(i.fecha).toLocaleDateString("es-ES")}</b>
              </p>
              <p className="text-xs text-gray-500">
                Próxima: {new Date(i.proxima_fecha).toLocaleDateString("es-ES")}
              </p>
            </div>
            <button onClick={() => eliminar(i.id)} className="text-xs text-gray-400 hover:text-red-600">
              Eliminar
            </button>
          </li>
        ))}
        {itvs.length === 0 && (
          <p className="text-sm text-gray-400">Sin registros de ITV todavía.</p>
        )}
      </ul>
    </div>
  );
}
