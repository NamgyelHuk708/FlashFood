"use client"

import { useEffect, useState, useRef } from "react"
import { View, Text, StyleSheet } from "react-native"
import { router } from "expo-router"
import { useAuthStore } from "../store/authStore"

export default function Index() {
  const { user, initialized } = useAuthStore()
  const [isReady, setIsReady] = useState(false)
  const hasRedirected = useRef(false)

  console.log("📱 Index page - User:", !!user, "Initialized:", initialized)

  useEffect(() => {
    console.log("📱 Index page mounted - User:", !!user, "Initialized:", initialized)

    if (initialized && !hasRedirected.current) {
      console.log(" Auth initialized, preparing redirect...")
      const timer = setTimeout(() => {
        console.log("Setting ready = true")
        setIsReady(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [initialized])

  useEffect(() => {
    if (isReady && initialized && !hasRedirected.current) {
      hasRedirected.current = true

      if (user) {
        console.log("Redirecting to (tabs)...")
        router.replace("/(tabs)")
      } else {
        console.log(" Redirecting to auth...")
        router.replace("/auth")
      }
    }
  }, [isReady, initialized, user])

  // Add a fallback timeout
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!hasRedirected.current) {
        console.log("⚠️ Fallback timeout reached, forcing redirect")
        hasRedirected.current = true
        if (user) {
          router.replace("/(tabs)")
        } else {
          router.replace("/auth")
        }
      }
    }, 8000)

    return () => clearTimeout(fallbackTimer)
  }, [user])

  console.log(
    "Index state - User:",
    !!user,
    "Initialized:",
    initialized,
    "Ready:",
    isReady,
    "HasRedirected:",
    hasRedirected.current,
  )

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Loading FlashFood...</Text>
      <Text style={styles.subtext}>{!initialized ? "Checking authentication..." : "Preparing app..."}</Text>
    </View>
  )
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
