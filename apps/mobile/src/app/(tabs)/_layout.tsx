import { Tabs } from "expo-router";
import {
  CalendarDaysIcon,
  DocumentTextIcon,
  UserCircleIcon,
} from "react-native-heroicons/outline";
import { useTheme } from "react-native-paper";

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Reservas",
          tabBarIcon: ({ color, size }) => <CalendarDaysIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: "Facturas",
          tabBarIcon: ({ color, size }) => <DocumentTextIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <UserCircleIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
