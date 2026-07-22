import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { crearHistorial } from "../services/api";

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function HistorialFormScreen({ route, navigation }) {
  const { gruaId } = route.params;
  const [tipo, setTipo] = useState("mantenimiento");
  const [observacion, setObservacion] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    if (!observacion) {
      Alert.alert("Falta la observación", "Describe brevemente qué se hizo.");
      return;
    }
    setGuardando(true);
    try {
      await crearHistorial({ grua_id: gruaId, tipo, observacion, fecha });
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <View className="flex-1 bg-slate-50 px-4 pt-4">
      <Text className="text-slate-600 font-semibold mb-2">Tipo de registro</Text>
      <View className="flex-row gap-2 mb-5">
        {["mantenimiento", "rotura"].map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTipo(t)}
            className={`flex-1 py-3 rounded-xl border items-center ${
              tipo === t ? "bg-accent border-accent" : "bg-white border-slate-200"
            }`}
          >
            <Text className={tipo === t ? "text-white font-bold" : "text-slate-600 font-semibold"}>
              {t === "mantenimiento" ? "Mantenimiento" : "Rotura"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="text-slate-600 font-semibold mb-2">Fecha (AAAA-MM-DD)</Text>
      <TextInput
        value={fecha}
        onChangeText={setFecha}
        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 mb-5"
      />

      <Text className="text-slate-600 font-semibold mb-2">¿Qué se hizo?</Text>
      <TextInput
        value={observacion}
        onChangeText={setObservacion}
        placeholder="Ej: cambio de aceite y filtros"
        placeholderTextColor="#94a3b8"
        multiline
        numberOfLines={4}
        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 mb-6 h-28"
        textAlignVertical="top"
      />

      <TouchableOpacity
        onPress={guardar}
        disabled={guardando}
        className="bg-accent rounded-xl py-4 items-center"
      >
        <Text className="text-white font-bold text-base">{guardando ? "Guardando..." : "Guardar"}</Text>
      </TouchableOpacity>
    </View>
  );
}
