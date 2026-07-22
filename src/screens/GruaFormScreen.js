import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { crearGrua, actualizarGrua, obtenerGrua, eliminarGrua } from "../services/api";

const TIPOS = ["coche taller", "plataforma ligera", "plataforma pesada", "furgon de moto"];

export default function GruaFormScreen({ route, navigation }) {
  const gruaId = route.params?.id;
  const [matricula, setMatricula] = useState("");
  const [marca, setMarca] = useState("");
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [codigo, setCodigo] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (gruaId) {
      obtenerGrua(gruaId).then((g) => {
        setMatricula(g.matricula);
        setMarca(g.marca);
        setTipo(g.tipo);
        setCodigo(g.codigo);
      });
    }
  }, [gruaId]);

  async function guardar() {
    if (!matricula || !marca || !codigo) {
      Alert.alert("Faltan datos", "Rellena matrícula, marca y código.");
      return;
    }
    setGuardando(true);
    try {
      const payload = { matricula, marca, tipo, codigo };
      if (gruaId) {
        await actualizarGrua(gruaId, payload);
      } else {
        await crearGrua(payload);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setGuardando(false);
    }
  }

  function confirmarBorrado() {
    Alert.alert("Eliminar grúa", "Esta acción no se puede deshacer. ¿Continuar?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await eliminarGrua(gruaId);
          navigation.popToTop();
        },
      },
    ]);
  }

  return (
    <ScrollView className="flex-1 bg-slate-50 px-4 pt-4">
      <Campo label="Matrícula" value={matricula} onChangeText={setMatricula} placeholder="1234ABC" />
      <Campo label="Marca" value={marca} onChangeText={setMarca} placeholder="Iveco, Mercedes..." />
      <Campo label="Código interno" value={codigo} onChangeText={setCodigo} placeholder="G-001" />

      <Text className="text-slate-600 font-semibold mb-2 mt-1">Tipo</Text>
      <View className="flex-row flex-wrap gap-2 mb-6">
        {TIPOS.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTipo(t)}
            className={`px-3 py-2 rounded-xl border ${
              tipo === t ? "bg-accent border-accent" : "bg-white border-slate-200"
            }`}
          >
            <Text className={tipo === t ? "text-white font-semibold" : "text-slate-600"}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={guardar}
        disabled={guardando}
        className="bg-accent rounded-xl py-4 items-center mb-3"
      >
        <Text className="text-white font-bold text-base">
          {guardando ? "Guardando..." : gruaId ? "Guardar cambios" : "Crear grúa"}
        </Text>
      </TouchableOpacity>

      {gruaId && (
        <TouchableOpacity onPress={confirmarBorrado} className="items-center py-3 mb-8">
          <Text className="text-danger font-semibold">Eliminar grúa</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function Campo({ label, ...props }) {
  return (
    <View className="mb-4">
      <Text className="text-slate-600 font-semibold mb-2">{label}</Text>
      <TextInput
        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900"
        placeholderTextColor="#94a3b8"
        {...props}
      />
    </View>
  );
}
