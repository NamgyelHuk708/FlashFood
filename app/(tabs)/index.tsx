"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet } from "react-native"
import { Redirect } from "expo-router"
import { useAuthStore } from "../../store/authStore"

export default function Index() {
  const { user, initialized } = useAuthStore()
  const [redirectReady, setRedirectReady] = useState(false)

  useEffect(() => {
    console.log("📱 Index page mounted - User:", !!user, "Initialized:", initialized)

    // Wait for auth to initialize before redirecting
    if (initialized) {
      console.log(" Auth initialized, preparing redirect...")
      const timer = setTimeout(() => {
        console.log(" Setting redirect ready = true")
        setRedirectReady(true)
      }, 500) // Small delay to ensure state is stable
      return () => clearTimeout(timer)
    }
  }, [initialized, user])

  // Add a fallback timeout to prevent infinite loading
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      console.log("⚠️ Fallback timeout reached, forcing redirect ready")
      setRedirectReady(true)
    }, 8000) // 8 second fallback

    return () => clearTimeout(fallbackTimer)
  }, [])

  console.log(" Index state - User:", !!user, "Initialized:", initialized, "Redirect ready:", redirectReady)

  // Show loading while initializing
  if (!initialized || !redirectReady) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading FlashFood...</Text>
        <Text style={styles.subtext}>{!initialized ? "Checking authentication..." : "Preparing app..."}</Text>
      </View>
    )
  }

  // Redirect based on auth state
  if (user) {
    console.log(" Redirecting to (tabs)...")
    return <Redirect href="/(tabs)" />
  } else {
    console.log("Redirecting to auth...")
    return <Redirect href="/auth" />
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FF6B35",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
})
