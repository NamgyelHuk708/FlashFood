"use client"

import { useState } from "react"
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as Location from "expo-location"

interface LocationPermissionModalProps {
  visible: boolean
  onClose: () => void
  onPermissionGranted: () => void
}

export default function LocationPermissionModal({
  visible,
  onClose,
  onPermissionGranted,
}: LocationPermissionModalProps) {
  const [requesting, setRequesting] = useState(false)

  async function requestPermission() {
    setRequesting(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === "granted") {
        onPermissionGranted()
        onClose()
      }
    } catch (error) {
      console.error("Error requesting location permission:", error)
    } finally {
      setRequesting(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={60} color="#FF6B35" />
          </View>

          <Text style={styles.title}>Enable Location Access</Text>
          <Text style={styles.description}>
            Flash Food would like to access your location to show nearby restaurants and provide personalized
            recommendations.
          </Text>

          <View style={styles.benefits}>
            <View style={styles.benefit}>
              <Ionicons name="restaurant" size={20} color="#FF6B35" />
              <Text style={styles.benefitText}>Find restaurants near you</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="navigate" size={20} color="#FF6B35" />
              <Text style={styles.benefitText}>Get accurate directions</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="star" size={20} color="#FF6B35" />
              <Text style={styles.benefitText}>Personalized recommendations</Text>
            </View>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.allowButton} onPress={requestPermission} disabled={requesting}>
              <Text style={styles.allowButtonText}>{requesting ? "Requesting..." : "Allow Location"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={onClose}>
              <Text style={styles.skipButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    width: "100%",
    maxWidth: 350,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 25,
  },
  benefits: {
    width: "100%",
    marginBottom: 30,
  },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 12,
  },
  buttons: {
    width: "100%",
    gap: 12,
  },
  allowButton: {
    backgroundColor: "#FF6B35",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  allowButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  skipButton: {
    paddingVertical: 15,
    alignItems: "center",
  },
  skipButtonText: {
    color: "#666",
    fontSize: 16,
  },
})
