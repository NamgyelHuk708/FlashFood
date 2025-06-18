"use client"

import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useAuthStore } from "../../store/authStore"

export default function TabLayout() {
  const { profile } = useAuthStore()

  console.log("🏷️ TabLayout rendering for user type:", profile?.user_type || "unknown")

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FF6B35",
        headerStyle: {
          backgroundColor: "#FF6B35",
        },
        headerTintColor: "#fff",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Restaurants",
          tabBarIcon: ({ color, size }) => <Ionicons name="restaurant" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
          tabBarIcon: ({ color, size }) => <Ionicons name="heart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: "Manage",
          tabBarIcon: ({ color, size }) => <Ionicons name="business" size={size} color={color} />,
          href: profile?.user_type === "owner" ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
