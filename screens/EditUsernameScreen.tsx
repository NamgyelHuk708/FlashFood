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
  ActivityIndicator,
} from "react-native"
import { supabase } from "../lib/supabase"
import { Ionicons } from "@expo/vector-icons"

export default function EditUsernameScreen({ navigation }: any) {
  const [currentUsername, setCurrentUsername] = useState("")
  const [newUsername, setNewUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    getCurrentUsername()
  }, [])

  useEffect(() => {
    if (newUsername.trim() && newUsername !== currentUsername) {
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(newUsername.trim())
      }, 500)
      return () => clearTimeout(timeoutId)
    } else {
      setIsAvailable(null)
    }
  }, [newUsername, currentUsername])

  async function getCurrentUsername() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase.from("profiles").select("username").eq("id", user.id).single()

        if (error) throw error
        setCurrentUsername(data?.username || "")
        setNewUsername(data?.username || "")
      }
    } catch (error: any) {
      Alert.alert("Error", error.message)
    } finally {
      setInitialLoading(false)
    }
  }

  async function checkUsernameAvailability(username: string) {
    if (username.length < 3) {
      setIsAvailable(false)
      return
    }

    setChecking(true)
    try {
      const { data, error } = await supabase.rpc("check_username_availability", {
        new_username: username,
      })

      if (error) throw error
      setIsAvailable(data)
    } catch (error: any) {
      console.error("Error checking username:", error.message)
      setIsAvailable(null)
    } finally {
      setChecking(false)
    }
  }

  async function updateUsername() {
    if (!newUsername.trim()) {
      Alert.alert("Error", "Username cannot be empty")
      return
    }

    if (newUsername.trim().length < 3) {
      Alert.alert("Error", "Username must be at least 3 characters long")
      return
    }

    if (newUsername === currentUsername) {
      navigation.goBack()
      return
    }

    if (!isAvailable) {
      Alert.alert("Error", "This username is not available")
      return
    }

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not found")

      const { error } = await supabase.from("profiles").update({ username: newUsername.trim() }).eq("id", user.id)

      if (error) throw error

      Alert.alert("Success", "Username updated successfully!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ])
    } catch (error: any) {
      Alert.alert("Error", error.message)
    } finally {
      setLoading(false)
    }
  }

  const isValidUsername = (username: string) => {
    return /^[a-zA-Z0-9_]+$/.test(username) && username.length >= 3
  }

  const getUsernameStatus = () => {
    if (!newUsername.trim() || newUsername === currentUsername) return null
    if (newUsername.length < 3) return { color: "#F44336", text: "Too short (min 3 characters)" }
    if (!isValidUsername(newUsername)) return { color: "#F44336", text: "Only letters, numbers, and underscores" }
    if (checking) return { color: "#666", text: "Checking availability..." }
    if (isAvailable === true) return { color: "#4CAF50", text: "Available!" }
    if (isAvailable === false) return { color: "#F44336", text: "Not available" }
    return null
  }

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  const status = getUsernameStatus()

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Username</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.currentUsernameContainer}>
          <Text style={styles.label}>Current Username</Text>
          <Text style={styles.currentUsername}>@{currentUsername}</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Username</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.atSymbol}>@</Text>
            <TextInput
              style={styles.input}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Enter new username"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
            />
            {checking && <ActivityIndicator size="small" color="#FF6B35" style={styles.checkingIndicator} />}
          </View>

          {status && (
            <View style={styles.statusContainer}>
              <Ionicons
                name={status.color === "#4CAF50" ? "checkmark-circle" : "alert-circle"}
                size={16}
                color={status.color}
              />
              <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
            </View>
          )}
        </View>

        <View style={styles.rulesContainer}>
          <Text style={styles.rulesTitle}>Username Rules:</Text>
          <Text style={styles.ruleText}>• At least 3 characters long</Text>
          <Text style={styles.ruleText}>• Only letters, numbers, and underscores</Text>
          <Text style={styles.ruleText}>• Must be unique</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (!isAvailable || newUsername === currentUsername || loading) && styles.saveButtonDisabled,
          ]}
          onPress={updateUsername}
          disabled={!isAvailable || newUsername === currentUsername || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Username</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  currentUsernameContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  currentUsername: {
    fontSize: 18,
    color: "#FF6B35",
    fontWeight: "bold",
  },
  inputContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
  },
  atSymbol: {
    fontSize: 18,
    color: "#666",
    marginRight: 5,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: "#333",
  },
  checkingIndicator: {
    marginLeft: 10,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  statusText: {
    fontSize: 14,
    marginLeft: 5,
  },
  rulesContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  ruleText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  saveButton: {
    backgroundColor: "#FF6B35",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#ccc",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
