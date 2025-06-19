"use client"

import "react-native-url-polyfill/auto"
import { useState, useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "./lib/supabase"
import AuthScreen from "./screens/AuthScreen"
import RestaurantsScreen from "./screens/RestaurantsScreen"
import RestaurantDetailScreen from "./screens/RestaurantDetailScreen"
import ProfileScreen from "./screens/ProfileScreen"
import FavoritesScreen from "./screens/FavoritesScreen"
import MapScreen from "./screens/MapScreen"
import MyReviewsScreen from "./screens/MyReviewsScreen"
import { Ionicons } from "@expo/vector-icons"
import EditUsernameScreen from "./screens/EditUsernameScreen"

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === "Restaurants") {
            iconName = focused ? "restaurant" : "restaurant-outline"
          } else if (route.name === "Map") {
            iconName = focused ? "map" : "map-outline"
          } else if (route.name === "Favorites") {
            iconName = focused ? "heart" : "heart-outline"
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline"
          } else {
            iconName = "home"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#FF6B35",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Restaurants" component={RestaurantsScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (loading) {
    return null
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {session && session.user ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
            <Stack.Screen
              name="RestaurantDetail"
              component={RestaurantDetailScreen}
              options={{ title: "Restaurant Details" }}
            />
            <Stack.Screen name="MyReviews" component={MyReviewsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="EditUsername" component={EditUsernameScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
