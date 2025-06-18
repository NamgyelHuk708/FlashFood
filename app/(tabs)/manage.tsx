"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { RestaurantService } from "../../services/restaurantService"
import { LocationService } from "../../services/locationService"

export default function ManageScreen() {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    cuisine: "",
    address: "",
    phone: "",
    hours: "",
    price_range: "$",
    description: "",
  })

  const handleSubmit = async () => {
    if (!formData.name || !formData.cuisine || !formData.address) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    try {
      // Get location coordinates from address (simplified)
      const location = await LocationService.getCurrentLocation()

      const restaurantData = {
        ...formData,
        rating: 0,
        review_count: 0,
        features: [],
        images: [],
        latitude: location?.coords.latitude,
        longitude: location?.coords.longitude,
      }

      await RestaurantService.createRestaurant(restaurantData)
      Alert.alert("Success", "Restaurant added successfully!")
      setShowForm(false)
      setFormData({
        name: "",
        cuisine: "",
        address: "",
        phone: "",
        hours: "",
        price_range: "$",
        description: "",
      })
    } catch (error) {
      Alert.alert("Error", "Failed to add restaurant")
    }
  }

  if (!showForm) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Manage Your Restaurants</Text>
          <Text style={styles.emptySubtext}>Add your restaurant to FlashFood and reach more customers</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.addButtonText}>Add Restaurant</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowForm(false)}>
            <Ionicons name="arrow-back" size={24} color="#FF6B35" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Restaurant</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Restaurant Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter restaurant name"
          />

          <Text style={styles.label}>Cuisine Type *</Text>
          <TextInput
            style={styles.input}
            value={formData.cuisine}
            onChangeText={(text) => setFormData({ ...formData, cuisine: text })}
            placeholder="e.g., Italian, Chinese, Mexican"
          />

          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder="Enter full address"
            multiline
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Operating Hours</Text>
          <TextInput
            style={styles.input}
            value={formData.hours}
            onChangeText={(text) => setFormData({ ...formData, hours: text })}
            placeholder="e.g., Mon-Sun 9AM-10PM"
          />

          <Text style={styles.label}>Price Range</Text>
          <View style={styles.priceContainer}>
            {["$", "$$", "$$$", "$$$$"].map((price) => (
              <TouchableOpacity
                key={price}
                style={[styles.priceButton, formData.price_range === price && styles.priceButtonActive]}
                onPress={() => setFormData({ ...formData, price_range: price })}
              >
                <Text style={[styles.priceText, formData.price_range === price && styles.priceTextActive]}>
                  {price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Describe your restaurant"
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Add Restaurant</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
    textAlign: "center",
    marginBottom: 32,
  },
  addButton: {
    backgroundColor: "#FF6B35",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  formContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "white",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  priceContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  priceButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "white",
  },
  priceButtonActive: {
    backgroundColor: "#FF6B35",
    borderColor: "#FF6B35",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  priceTextActive: {
    color: "white",
  },
  submitButton: {
    backgroundColor: "#FF6B35",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
})
