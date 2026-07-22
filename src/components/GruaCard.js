import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

const COLOR_TIPO = {
  "coche taller": "bg-blue-100 text-blue-700",
  "plataforma ligera": "bg-emerald-100 text-emerald-700",
  "plataforma pesada": "bg-amber-100 text-amber-700",
  "patrol": "bg-green-100 text-green-700",
  "furgon de moto": "bg-purple-100 text-purple-700",
};

export default function GruaCard({ grua, onPress }) {
  const badge = COLOR_TIPO[grua.tipo] || "bg-slate-100 text-slate-700";

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-slate-100"
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-center">
        <Text className="text-lg font-bold text-slate-900">{grua.matricula}</Text>
        <View className={`px-2 py-1 rounded-full ${badge}`}>
          <Text className="text-xs font-semibold">{grua.tipo}</Text>
        </View>
      </View>
      <Text className="text-slate-500 mt-1">
        {grua.marca} · Código {grua.codigo}
      </Text>
    </TouchableOpacity>
  );
}
