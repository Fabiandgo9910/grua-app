import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { obtenerGrua, listarHistorial, listarITV } from "../services/api";
import { suscribirCambiosRealtime } from "../services/notifications";

function diasHasta(fechaStr) {
  const hoy = new Date();
  const fecha = new Date(fechaStr);
  return Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
}

export default function GruaDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [grua, setGrua] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [itv, setItv] = useState([]);

  const cargar = useCallback(async () => {
    const [g, h, i] = await Promise.all([obtenerGrua(id), listarHistorial(id), listarITV(id)]);
    setGrua(g);
    setHistorial(h);
    setItv(i);
  }, [id]);

  useEffect(() => {
    cargar();
    const off1 = suscribirCambiosRealtime("historial", cargar);
    const off2 = suscribirCambiosRealtime("itv", cargar);
    const off3 = suscribirCambiosRealtime("gruas", cargar);
    return () => {
      off1();
      off2();
      off3();
    };
  }, [cargar]);

  if (!grua) return null;

  const proximaITV = itv[0];
  const diasRestantes = proximaITV ? diasHasta(proximaITV.proxima_fecha) : null;

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="bg-primary px-5 py-6">
        <Text className="text-white text-2xl font-bold">{grua.matricula}</Text>
        <Text className="text-slate-300">
          {grua.marca} · {grua.tipo} · Código {grua.codigo}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("GruaForm", { id: grua.id })}
          className="mt-3 bg-white/10 rounded-lg px-3 py-2 self-start"
        >
          <Text className="text-white font-semibold">Editar datos</Text>
        </TouchableOpacity>
      </View>

      {/* ITV */}
      <View className="px-4 mt-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-bold text-slate-900">ITV</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("ITVForm", { gruaId: id })}
            className="bg-accent px-3 py-1.5 rounded-lg"
          >
            <Text className="text-white font-semibold text-sm">Registrar ITV</Text>
          </TouchableOpacity>
        </View>

        {proximaITV ? (
          <View
            className={`rounded-xl p-4 border ${
              diasRestantes <= 7 ? "bg-amber-50 border-amber-300" : "bg-white border-slate-200"
            }`}
          >
            <Text className="text-slate-700">
              Última ITV: <Text className="font-semibold">{proximaITV.fecha}</Text>
            </Text>
            <Text className="text-slate-700">
              Próxima ITV: <Text className="font-semibold">{proximaITV.proxima_fecha}</Text>
            </Text>
            {diasRestantes <= 7 && (
              <Text className="text-amber-700 font-semibold mt-1">
                ⚠️ Quedan {diasRestantes} día(s). Se avisará automáticamente 7 días antes.
              </Text>
            )}
          </View>
        ) : (
          <Text className="text-slate-400">Sin registros de ITV todavía.</Text>
        )}

        {itv.slice(1).map((r) => (
          <Text key={r.id} className="text-slate-500 mt-2">
            · Pasada el {r.fecha}
          </Text>
        ))}
      </View>

      {/* Historial */}
      <View className="px-4 mt-6 mb-10">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-bold text-slate-900">Historial de taller</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("HistorialForm", { gruaId: id })}
            className="bg-accent px-3 py-1.5 rounded-lg"
          >
            <Text className="text-white font-semibold text-sm">+ Nuevo</Text>
          </TouchableOpacity>
        </View>

        {historial.length === 0 && (
          <Text className="text-slate-400">Sin idas al taller registradas.</Text>
        )}

        {historial.map((h) => (
          <View key={h.id} className="bg-white rounded-xl p-3 mb-2 border border-slate-100">
            <View className="flex-row justify-between">
              <Text
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  h.tipo === "rotura" ? "bg-red-100 text-danger" : "bg-blue-100 text-accent"
                }`}
              >
                {h.tipo === "rotura" ? "ROTURA" : "MANTENIMIENTO"}
              </Text>
              <Text className="text-slate-400 text-xs">{h.fecha}</Text>
            </View>
            <Text className="text-slate-700 mt-2">{h.observacion}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
