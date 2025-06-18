"use client"

import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface UserTypeSelectorProps {
  selectedValue: "customer" | "owner"
  onValueChange: (value: "customer" | "owner") => void
}

export default function UserTypeSelector({ selectedValue, onValueChange }: UserTypeSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>I am a:</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, selectedValue === "customer" && styles.buttonActive]}
          onPress={() => onValueChange("customer")}
        >
          <Ionicons
            name="person"
            size={20}
            color={selectedValue === "customer" ? "white" : "#FF6B35"}
            style={styles.icon}
          />
          <Text style={[styles.buttonText, selectedValue === "customer" && styles.buttonTextActive]}>Customer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, selectedValue === "owner" && styles.buttonActive]}
          onPress={() => onValueChange("owner")}
        >
          <Ionicons
            name="business"
            size={20}
            color={selectedValue === "owner" ? "white" : "#FF6B35"}
            style={styles.icon}
          />
          <Text style={[styles.buttonText, selectedValue === "owner" && styles.buttonTextActive]}>
            Restaurant Owner
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 12,
    color: "#333",
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderWidth: 2,
    borderColor: "#FF6B35",
    borderRadius: 8,
    backgroundColor: "white",
  },
  buttonActive: {
    backgroundColor: "#FF6B35",
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6B35",
    textAlign: "center",
  },
  buttonTextActive: {
    color: "white",
  },
})
