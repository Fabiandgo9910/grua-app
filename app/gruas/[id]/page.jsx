"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TIPOS } from "@/components/GruaCard";
import ConfirmModal from "@/components/ConfirmModal";

function sumarAnios(fechaStr, anios) {
  if (!fechaStr) return "";
  const f = new Date(fechaStr);
  f.setFullYear(f.getFullYear() + anios);
  return f.toISOString().slice(0, 10);
}

export default function FichaGrua() {
  const { id } = useParams();
  const router = useRouter();

  const [grua, setGrua] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [itvs, setItvs] = useState([]);
  const [tacografos, setTacografos] = useState([]);
  const [tab, setTab] = useState("datos");
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState(null);
  const [confirmandoEliminarGrua, setConfirmandoEliminarGrua] = useState(false);

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
    const { data: t } = await supabase
      .from("tacografo_historial")
      .select("*")
      .eq("grua_id", id)
      .order("fecha", { ascending: false });

    setGrua(g);
    setForm(g);
    setHistorial(h || []);
    setItvs(i || []);
    setTacografos(t || []);
  }, [id]);

  useEffect(() => {
    cargarTodo();
    // El tiempo real sigue activo como refuerzo (por si otro dispositivo
    // cambia algo), pero cada acción de este mismo dispositivo ya refresca
    // al instante llamando a cargarTodo() directamente, sin esperar a esto.
    const channel = supabase
      .channel(`realtime-grua-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "gruas", filter: `id=eq.${id}` }, cargarTodo)
      .on("postgres_changes", { event: "*", schema: "public", table: "historial_taller", filter: `grua_id=eq.${id}` }, cargarTodo)
      .on("postgres_changes", { event: "*", schema: "public", table: "itv_historial", filter: `grua_id=eq.${id}` }, cargarTodo)
      .on("postgres_changes", { event: "*", schema: "public", table: "tacografo_historial", filter: `grua_id=eq.${id}` }, cargarTodo)
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
        modelo: form.modelo,
        tipo: form.tipo,
        codigo: form.codigo,
      })
      .eq("id", id);
    setEditando(false);
    cargarTodo();
  }

  async function eliminarGrua() {
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
              onClick={() => setConfirmandoEliminarGrua(true)}
              className="text-red-600 text-sm hover:underline"
            >
              Eliminar grúa
            </button>
          </div>
        </div>

        <ConfirmModal
          abierto={confirmandoEliminarGrua}
          titulo="Eliminar grúa"
          mensaje={`Se eliminará la grúa ${grua.matricula} y todo su historial (mantenimientos, roturas, ITV y tacógrafo). Esta acción no se puede deshacer.`}
          onConfirmar={eliminarGrua}
          onCancelar={() => setConfirmandoEliminarGrua(false)}
        />

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-200 overflow-x-auto">
          {[
            { key: "datos", label: "Datos" },
            { key: "historial", label: "Mantenimiento / Roturas" },
            { key: "itv", label: "ITV" },
            { key: "tacografo", label: "Tacógrafo" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${
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
                <Campo label="Modelo" valor={grua.modelo || "—"} />
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
                <Input label="Modelo" value={form.modelo || ""} onChange={(v) => setForm({ ...form, modelo: v })} required={false} />
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

        {tab === "historial" && (
          <HistorialTaller gruaId={id} historial={historial} onCambio={cargarTodo} />
        )}

        {tab === "itv" && (
          <ControlFecha
            gruaId={id}
            registros={itvs}
            tabla="itv_historial"
            etiqueta="ITV"
            aniosPorDefecto={1}
            onCambio={cargarTodo}
          />
        )}

        {tab === "tacografo" && (
          <ControlFecha
            gruaId={id}
            registros={tacografos}
            tabla="tacografo_historial"
            etiqueta="Tacógrafo"
            aniosPorDefecto={2}
            onCambio={cargarTodo}
          />
        )}
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

function Input({ label, value, onChange, required = true, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function HistorialTaller({ gruaId, historial, onCambio }) {
  const [tipo, setTipo] = useState("mantenimiento");
  const [taller, setTaller] = useState("");
  const [observacion, setObservacion] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [editandoId, setEditandoId] = useState(null);
  const [formEdicion, setFormEdicion] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);

  async function agregar(e) {
    e.preventDefault();
    await supabase.from("historial_taller").insert([
      { grua_id: gruaId, tipo, taller, observacion, fecha },
    ]);
    setTaller("");
    setObservacion("");
    onCambio();
  }

  async function confirmarEliminar() {
    await supabase.from("historial_taller").delete().eq("id", aEliminar);
    setAEliminar(null);
    onCambio();
  }

  function empezarEdicion(h) {
    setEditandoId(h.id);
    setFormEdicion({ tipo: h.tipo, taller: h.taller || "", observacion: h.observacion || "", fecha: h.fecha });
  }

  async function guardarEdicion(idRegistro) {
    await supabase.from("historial_taller").update(formEdicion).eq("id", idRegistro);
    setEditandoId(null);
    setFormEdicion(null);
    onCambio();
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <ConfirmModal
        abierto={!!aEliminar}
        titulo="Eliminar registro"
        mensaje="Se eliminará este registro de mantenimiento/rotura. Esta acción no se puede deshacer."
        onConfirmar={confirmarEliminar}
        onCancelar={() => setAEliminar(null)}
      />

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
        <input
          value={taller}
          onChange={(e) => setTaller(e.target.value)}
          placeholder="Taller donde se hizo"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
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
          <li key={h.id} className="border border-gray-100 rounded-lg p-3">
            {editandoId === h.id ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <select
                    value={formEdicion.tipo}
                    onChange={(e) => setFormEdicion({ ...formEdicion, tipo: e.target.value })}
                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                  >
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="rotura">Rotura</option>
                  </select>
                  <input
                    type="date"
                    value={formEdicion.fecha}
                    onChange={(e) => setFormEdicion({ ...formEdicion, fecha: e.target.value })}
                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                  />
                </div>
                <input
                  value={formEdicion.taller}
                  onChange={(e) => setFormEdicion({ ...formEdicion, taller: e.target.value })}
                  placeholder="Taller"
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                />
                <textarea
                  value={formEdicion.observacion}
                  onChange={(e) => setFormEdicion({ ...formEdicion, observacion: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => guardarEdicion(h.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700 transition"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditandoId(null)}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs hover:bg-gray-200 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      h.tipo === "rotura" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    }`}
                  >
                    {h.tipo === "rotura" ? "Rotura" : "Mantenimiento"}
                  </span>
                  {h.taller && (
                    <p className="text-xs text-gray-500 mt-1">Taller: {h.taller}</p>
                  )}
                  <p className="text-sm mt-1">{h.observacion}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(h.fecha).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => empezarEdicion(h)} className="text-xs text-gray-400 hover:text-blue-600">
                    Editar
                  </button>
                  <button onClick={() => setAEliminar(h.id)} className="text-xs text-gray-400 hover:text-red-600">
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
        {historial.length === 0 && (
          <p className="text-sm text-gray-400">Sin registros todavía.</p>
        )}
      </ul>
    </div>
  );
}

// Componente genérico reutilizado por ITV (+1 año por defecto) y
// Tacógrafo (+2 años por defecto). Permite crear, editar y eliminar.
function ControlFecha({ gruaId, registros, tabla, etiqueta, aniosPorDefecto, onCambio }) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [proximaFecha, setProximaFecha] = useState(
    sumarAnios(new Date().toISOString().slice(0, 10), aniosPorDefecto)
  );
  const [editandoId, setEditandoId] = useState(null);
  const [formEdicion, setFormEdicion] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);

  function cambiarFecha(nuevaFecha) {
    setFecha(nuevaFecha);
    // Autocompleta la próxima fecha (+1 año ITV / +2 años tacógrafo).
    // El campo sigue siendo editable si se quiere ajustar a mano.
    setProximaFecha(sumarAnios(nuevaFecha, aniosPorDefecto));
  }

  async function agregar(e) {
    e.preventDefault();
    await supabase.from(tabla).insert([
      { grua_id: gruaId, fecha, proxima_fecha: proximaFecha },
    ]);

    // Si la fecha que se acaba de registrar ya está a 7 días o menos,
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

    const base = new Date().toISOString().slice(0, 10);
    setFecha(base);
    setProximaFecha(sumarAnios(base, aniosPorDefecto));
    onCambio();
  }

  async function confirmarEliminar() {
    await supabase.from(tabla).delete().eq("id", aEliminar);
    setAEliminar(null);
    onCambio();
  }

  function empezarEdicion(r) {
    setEditandoId(r.id);
    setFormEdicion({ fecha: r.fecha, proxima_fecha: r.proxima_fecha });
  }

  async function guardarEdicion(idRegistro) {
    await supabase.from(tabla).update(formEdicion).eq("id", idRegistro);
    setEditandoId(null);
    setFormEdicion(null);
    onCambio();
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <ConfirmModal
        abierto={!!aEliminar}
        titulo={`Eliminar registro de ${etiqueta}`}
        mensaje="Este registro se eliminará permanentemente. Esta acción no se puede deshacer."
        onConfirmar={confirmarEliminar}
        onCancelar={() => setAEliminar(null)}
      />

      <form onSubmit={agregar} className="space-y-3 mb-6 border-b border-gray-100 pb-6">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha en la que se pasó el {etiqueta}</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => cambiarFecha(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Fecha del próximo {etiqueta} (automática +{aniosPorDefecto} año{aniosPorDefecto > 1 ? "s" : ""}, puedes cambiarla)
          </label>
          <input
            type="date"
            value={proximaFecha}
            onChange={(e) => setProximaFecha(e.target.value)}
            required
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
          Registrar {etiqueta}
        </button>
      </form>

      <ul className="space-y-3">
        {registros.map((r) => (
          <li key={r.id} className="border border-gray-100 rounded-lg p-3">
            {editandoId === r.id ? (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fecha pasada</label>
                  <input
                    type="date"
                    value={formEdicion.fecha}
                    onChange={(e) => setFormEdicion({ ...formEdicion, fecha: e.target.value })}
                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Próxima fecha</label>
                  <input
                    type="date"
                    value={formEdicion.proxima_fecha}
                    onChange={(e) => setFormEdicion({ ...formEdicion, proxima_fecha: e.target.value })}
                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => guardarEdicion(r.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700 transition"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditandoId(null)}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs hover:bg-gray-200 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm">
                    Pasada el <b>{new Date(r.fecha).toLocaleDateString("es-ES")}</b>
                  </p>
                  <p className="text-xs text-gray-500">
                    Próxima: {new Date(r.proxima_fecha).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => empezarEdicion(r)} className="text-xs text-gray-400 hover:text-blue-600">
                    Editar
                  </button>
                  <button onClick={() => setAEliminar(r.id)} className="text-xs text-gray-400 hover:text-red-600">
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
        {registros.length === 0 && (
          <p className="text-sm text-gray-400">Sin registros de {etiqueta} todavía.</p>
        )}
      </ul>
    </div>
  );
}
