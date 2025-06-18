"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { supabase } from "../lib/supabase"
import LocationPermissionModal from "../components/LocationPermissionModal"

export default function AuthScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)

  useEffect(() => {
    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Show location permission modal after successful sign in
        setTimeout(() => {
          setShowLocationModal(true)
        }, 1000)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithEmail() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) Alert.alert("Error", error.message)
    setLoading(false)
  }

  async function signUpWithEmail() {
    setLoading(true)
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    })

    if (error) Alert.alert("Error", error.message)
    if (!session) Alert.alert("Success", "Please check your inbox for email verification!")
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.content}>
        <Text style={styles.title}>Flash Food</Text>
        <Text style={styles.subtitle}>Discover amazing restaurants nearby</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={isSignUp ? signUpWithEmail : signInWithEmail}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.linkText}>
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <LocationPermissionModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onPermissionGranted={() => {
          Alert.alert("Great!", "You'll now see personalized restaurant recommendations based on your location.")
        }}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    color: "#FF6B35",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 40,
  },
  form: {
    gap: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#FF6B35",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkText: {
    color: "#FF6B35",
    fontSize: 14,
  },
})
