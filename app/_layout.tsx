"use client"

import { useEffect, useState } from "react"
import { Stack } from "expo-router"
import { View, Text, StyleSheet } from "react-native"
import { supabase } from "../lib/superbase"
import { useAuthStore } from "../store/authStore"

export default function RootLayout() {
  const { user, initialized, loadProfile } = useAuthStore()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    console.log(" Root layout mounted, setting up auth")

    const initializeAuth = async () => {
      try {
        // Check current session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error(" Session check error:", error)
          useAuthStore.setState({ initialized: true })
          setIsReady(true)
          return
        }

        console.log("Initial session:", !!session?.user)
        if (session?.user) {
          useAuthStore.setState({ user: session.user, initialized: true })
          await loadProfile()
        } else {
          useAuthStore.setState({ initialized: true })
        }
        setIsReady(true)
      } catch (error) {
        console.error("Auth initialization failed:", error)
        useAuthStore.setState({ initialized: true })
        setIsReady(true)
      }
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id)

      if (event === "SIGNED_IN" && session?.user) {
        console.log("User signed in")
        useAuthStore.setState({ user: session.user, initialized: true })
        await loadProfile()
        setIsReady(true)
      } else if (event === "SIGNED_OUT") {
        console.log(" User signed out")
        useAuthStore.setState({ user: null, profile: null, initialized: true })
        setIsReady(true)
      }
    })

    initializeAuth()

    return () => {
      console.log("Cleaning up auth subscription")
      subscription.unsubscribe()
    }
  }, [])

  // Show loading screen while initializing
  if (!isReady || !initialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading FlashFood...</Text>
        <Text style={styles.loadingSubtext}>Checking authentication...</Text>
      </View>
    )
  }

  console.log("Root layout ready - User:", !!user, "Initialized:", initialized)

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        // Authenticated routes
        <>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="restaurant/[id]" options={{ headerShown: true, title: "Restaurant Details" }} />
        </>
      ) : (
        // Unauthenticated routes
        <Stack.Screen name="auth" />
      )}
    </Stack>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FF6B35",
  },
  loadingText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
})
