"use client"

import { useState } from "react"
import {
  View,
  Text,
  ScrollView,
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

const cuisineTypes = [
  "Italian",
  "Chinese",
  "Japanese",
  "Mexican",
  "Indian",
  "American",
  "French",
  "Thai",
  "Mediterranean",
  "Korean",
  "Vietnamese",
  "Greek",
  "Spanish",
  "Other",
]

const priceRanges = [
  { value: "$", label: "$ - Budget friendly" },
  { value: "$$", label: "$$ - Moderate" },
  { value: "$$$", label: "$$$ - Expensive" },
  { value: "$$$$", label: "$$$$ - Very expensive" },
]

interface Restaurant {
  id: string
  name: string
  cuisine_type: string
  address: string
  phone: string
  email: string
  website: string
  description: string
  price_range: string
  latitude: number
  longitude: number
}

export default function EditRestaurantScreen({ route, navigation }: any) {
  const { restaurant: initialRestaurant } = route.params
  const [formData, setFormData] = useState({
    name: initialRestaurant.name || "",
    cuisine_type: initialRestaurant.cuisine_type || "",
    address: initialRestaurant.address || "",
    phone: initialRestaurant.phone || "",
    email: initialRestaurant.email || "",
    website: initialRestaurant.website || "",
    description: initialRestaurant.description || "",
    price_range: initialRestaurant.price_range || "$$",
  })
  const [loading, setLoading] = useState(false)
  const [showCuisineDropdown, setShowCuisineDropdown] = useState(false)
  const [showPriceDropdown, setShowPriceDropdown] = useState(false)

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Restaurant name is required")
      return false
    }
    if (!formData.cuisine_type) {
      Alert.alert("Error", "Please select a cuisine type")
      return false
    }
    if (!formData.address.trim()) {
      Alert.alert("Error", "Address is required")
      return false
    }
    if (!formData.phone.trim()) {
      Alert.alert("Error", "Phone number is required")
      return false
    }
    return true
  }

  async function updateRestaurant() {
    if (!validateForm()) return

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Check if user owns this restaurant
      const { data: ownership, error: ownershipError } = await supabase
        .from("restaurant_owners")
        .select("id")
        .eq("user_id", user.id)
        .eq("restaurant_id", initialRestaurant.id)
        .eq("status", "approved")
        .single()

      if (ownershipError || !ownership) {
        throw new Error("You don't have permission to edit this restaurant")
      }

      // Update restaurant
      const { error: updateError } = await supabase
        .from("restaurants")
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", initialRestaurant.id)

      if (updateError) throw updateError

      Alert.alert("Success", "Restaurant updated successfully!", [
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

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Restaurant</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Restaurant Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => updateFormData("name", value)}
              placeholder="Enter restaurant name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cuisine Type *</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowCuisineDropdown(!showCuisineDropdown)}>
              <Text style={[styles.dropdownText, !formData.cuisine_type && styles.placeholderText]}>
                {formData.cuisine_type || "Select cuisine type"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
            {showCuisineDropdown && (
              <View style={styles.dropdownList}>
                {cuisineTypes.map((cuisine) => (
                  <TouchableOpacity
                    key={cuisine}
                    style={styles.dropdownItem}
                    onPress={() => {
                      updateFormData("cuisine_type", cuisine)
                      setShowCuisineDropdown(false)
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{cuisine}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(value) => updateFormData("address", value)}
              placeholder="Enter full address"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price Range</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowPriceDropdown(!showPriceDropdown)}>
              <Text style={styles.dropdownText}>
                {priceRanges.find((p) => p.value === formData.price_range)?.label}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
            {showPriceDropdown && (
              <View style={styles.dropdownList}>
                {priceRanges.map((price) => (
                  <TouchableOpacity
                    key={price.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      updateFormData("price_range", price.value)
                      setShowPriceDropdown(false)
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{price.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(value) => updateFormData("phone", value)}
              placeholder="+1 (555) 123-4567"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => updateFormData("email", value)}
              placeholder="restaurant@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={formData.website}
              onChangeText={(value) => updateFormData("website", value)}
              placeholder="https://www.restaurant.com"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>About Your Restaurant</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => updateFormData("description", value)}
              placeholder="Tell customers about your restaurant, specialties, atmosphere, etc."
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={updateRestaurant}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#FF6B35" />
          <Text style={styles.infoText}>Changes will be visible to customers immediately after saving.</Text>
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
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  dropdownText: {
    fontSize: 16,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginTop: 5,
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B35",
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#FFF3E0",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#E65100",
    marginLeft: 10,
    lineHeight: 20,
  },
})
