// PRESENTATION LAYER - Reusable Loading Component
import type React from "react"
import { View, ActivityIndicator, Text, StyleSheet } from "react-native"

interface LoadingSpinnerProps {
  message?: string
  size?: "small" | "large"
  color?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Loading...",
  size = "large",
  color = "#FF6B35",
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  message: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
})

export default LoadingSpinner
