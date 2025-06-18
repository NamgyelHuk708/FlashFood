"use client"

import { useState } from "react"
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
import { useAuthStore } from "../store/authStore"
import UserTypeSelector from "../components/UserTypeSelector"
import { supabase } from "../lib/superbase"

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [userType, setUserType] = useState<"customer" | "owner">("customer")

  const { signIn, signUp, loading } = useAuthStore()

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    if (isSignUp && !fullName) {
      Alert.alert("Error", "Please enter your full name")
      return
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address")
      return
    }

    try {
      if (isSignUp) {
        console.log(" Attempting signup...")
        await signUp(email, password, fullName, userType)
        Alert.alert(
          "Check Your Email",
          "We've sent you a confirmation link. Please check your email and click the link to verify your account before signing in.",
          [{ text: "OK", onPress: () => setIsSignUp(false) }],
        )
      } else {
        console.log("Attempting signin...")
        await signIn(email, password)
        console.log("Signin completed")
        // Navigation will be handled by the root layout
      }
    } catch (error: any) {
      console.error(" Auth error:", error)
      let errorMessage = "Authentication failed"

      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password"
      } else if (error.message.includes("User already registered")) {
        errorMessage = "An account with this email already exists"
      } else if (error.message.includes("Email not confirmed")) {
        Alert.alert(
          "Email Not Confirmed",
          "Please check your email and click the confirmation link to verify your account before signing in.",
          [{ text: "Resend Email", onPress: () => resendConfirmation() }, { text: "OK" }],
        )
        return
      } else if (error.message) {
        errorMessage = error.message
      }

      Alert.alert("Error", errorMessage)
    }
  }

  const resendConfirmation = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      })
      if (error) throw error
      Alert.alert("Email Sent", "Confirmation email has been resent. Please check your inbox.")
    } catch (error) {
      Alert.alert("Error", "Failed to resend confirmation email")
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>FlashFood</Text>
        <Text style={styles.subtitle}>{isSignUp ? "Create your account" : "Welcome back"}</Text>

        {isSignUp && (
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {isSignUp && <UserTypeSelector selectedValue={userType} onValueChange={setUserType} />}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchButton} onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.switchText}>
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
  },
  formContainer: {
    margin: 32,
    padding: 24,
    backgroundColor: "white",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    color: "#FF6B35",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#FF6B35",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  switchButton: {
    alignItems: "center",
  },
  switchText: {
    color: "#FF6B35",
    fontSize: 16,
  },
})
