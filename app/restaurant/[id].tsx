"use client"

import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

// Sample restaurant data
const RESTAURANT_DATA: { [key: string]: any } = {
  "1": {
    id: "1",
    name: "Pizza Palace",
    cuisine: "Italian",
    rating: 4.5,
    review_count: 120,
    address: "123 Main St, Downtown",
    phone: "+1-555-0123",
    hours: "Mon-Sun 11AM-11PM",
    price_range: "$$",
    description: "Authentic Italian pizza with fresh ingredients and traditional recipes.",
  },
  "2": {
    id: "2",
    name: "Sushi Zen",
    cuisine: "Japanese",
    rating: 4.8,
    review_count: 89,
    address: "456 Oak Ave, Midtown",
    phone: "+1-555-0456",
    hours: "Tue-Sun 5PM-10PM",
    price_range: "$$$",
    description: "Fresh sushi and traditional Japanese cuisine in an elegant setting.",
  },
}

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const restaurant = RESTAURANT_DATA[id || "1"] || RESTAURANT_DATA["1"]

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={styles.rating}>{restaurant.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({restaurant.review_count} reviews)</Text>
          </View>
          <Text style={styles.priceRange}>{restaurant.price_range}</Text>
        </View>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={28} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.contactItem}>
          <Ionicons name="location-outline" size={20} color="#666" />
          <Text style={styles.contactText}>{restaurant.address}</Text>
        </View>
        <View style={styles.contactItem}>
          <Ionicons name="call-outline" size={20} color="#666" />
          <Text style={styles.contactText}>{restaurant.phone}</Text>
        </View>
        <View style={styles.contactItem}>
          <Ionicons name="time-outline" size={20} color="#666" />
          <Text style={styles.contactText}>{restaurant.hours}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>{restaurant.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        <TouchableOpacity style={styles.reviewButton}>
          <Ionicons name="star-outline" size={20} color="#FF6B35" />
          <Text style={styles.reviewButtonText}>Write a Review</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cuisine: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  rating: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: "600",
  },
  reviewCount: {
    marginLeft: 4,
    fontSize: 14,
    color: "#666",
  },
  priceRange: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B35",
  },
  favoriteButton: {
    padding: 8,
  },
  section: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  contactText: {
    marginLeft: 12,
    fontSize: 16,
    flex: 1,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#FF6B35",
    borderRadius: 8,
    justifyContent: "center",
  },
  reviewButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#FF6B35",
    fontWeight: "600",
  },
})
