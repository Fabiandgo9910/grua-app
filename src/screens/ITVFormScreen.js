import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { crearITV } from "../services/api";

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function sumarMeses(fechaISO, meses) {
  const d = new Date(fechaISO);
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().slice(0, 10);
}

export default function ITVFormScreen({ route, navigation }) {
  const { gruaId } = route.params;
  const [fecha, setFecha] = useState(hoyISO());
  const [meses, setMeses] = useState("12"); // periodicidad habitual, editable
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);
    try {
      const proxima_fecha = sumarMeses(fecha, parseInt(meses, 10) || 12);
      await crearITV({ grua_id: gruaId, fecha, proxima_fecha });
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <View className="flex-1 bg-slate-50 px-4 pt-4">
      <Text className="text-slate-600 font-semibold mb-2">Fecha en la que se ha pasado (AAAA-MM-DD)</Text>
      <TextInput
        value={fecha}
        onChangeText={setFecha}
        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 mb-5"
      />

      <Text className="text-slate-600 font-semibold mb-2">Periodicidad (meses hasta la próxima)</Text>
      <TextInput
        value={meses}
        onChangeText={setMeses}
        keyboardType="numeric"
        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 mb-6"
      />

      <Text className="text-slate-400 mb-6">
        Se calculará la próxima fecha automáticamente y el sistema avisará una semana antes.
      </Text>

      <TouchableOpacity
        onPress={guardar}
        disabled={guardando}
        className="bg-accent rounded-xl py-4 items-center"
      >
        <Text className="text-white font-bold text-base">{guardando ? "Guardando..." : "Guardar ITV"}</Text>
      </TouchableOpacity>
    </View>
  );
}
