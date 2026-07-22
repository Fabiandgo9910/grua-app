import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { listarGruas } from "../services/api";
import { suscribirCambiosRealtime } from "../services/notifications";
import GruaCard from "../components/GruaCard";

export default function GruasListScreen({ navigation }) {
  const [gruas, setGruas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const data = await listarGruas();
      setGruas(data);
    } catch (e) {
      console.log(e);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    // Se actualiza sola cuando alguien añade/edita/borra una grúa (tiempo real)
    const desuscribir = suscribirCambiosRealtime("gruas", cargar);
    return desuscribir;
  }, [cargar]);

  return (
    <View className="flex-1 bg-slate-50 px-4 pt-4">
      <FlatList
        data={gruas}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargar} />}
        ListEmptyComponent={
          !cargando && (
            <Text className="text-center text-slate-400 mt-10">
              Todavía no hay grúas. Pulsa "+" para añadir la primera.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <GruaCard grua={item} onPress={() => navigation.navigate("GruaDetail", { id: item.id })} />
        )}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate("GruaForm")}
        className="absolute bottom-6 right-6 bg-accent w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Text className="text-white text-3xl leading-8">+</Text>
      </TouchableOpacity>
    </View>
  );
}
