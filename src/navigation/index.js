import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import GruasListScreen from "../screens/GruasListScreen";
import GruaFormScreen from "../screens/GruaFormScreen";
import GruaDetailScreen from "../screens/GruaDetailScreen";
import HistorialFormScreen from "../screens/HistorialFormScreen";
import ITVFormScreen from "../screens/ITVFormScreen";

const Stack = createNativeStackNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="GruasList"
        screenOptions={{
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        <Stack.Screen name="GruasList" component={GruasListScreen} options={{ title: "Grúas" }} />
        <Stack.Screen name="GruaForm" component={GruaFormScreen} options={{ title: "Grúa" }} />
        <Stack.Screen
          name="GruaDetail"
          component={GruaDetailScreen}
          options={{ title: "Ficha de grúa" }}
        />
        <Stack.Screen
          name="HistorialForm"
          component={HistorialFormScreen}
          options={{ title: "Nuevo registro" }}
        />
        <Stack.Screen name="ITVForm" component={ITVFormScreen} options={{ title: "Registrar ITV" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
