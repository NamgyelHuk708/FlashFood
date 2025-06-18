"use client"

import { useEffect } from "react"
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native"
import { router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useRestaurantStore } from "../../store/restaurantStore"
import type { Restaurant } from "../../types"

export default function FavoritesScreen() {
  const { restaurants, favorites, loadFavorites, removeFromFavorites } = useRestaurantStore()

  useEffect(() => {
    loadFavorites()
  }, [])

  const favoriteRestaurants = restaurants.filter((restaurant) => favorites.includes(restaurant.id))

  const removeFavorite = async (restaurantId: string) => {
    await removeFromFavorites(restaurantId)
  }

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity style={styles.restaurantCard} onPress={() => router.push(`/restaurant/${item.id}`)}>
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{item.name}</Text>
        <Text style={styles.restaurantCuisine}>{item.cuisine}</Text>
        <Text style={styles.restaurantAddress}>{item.address}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({item.review_count} reviews)</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.favoriteButton} onPress={() => removeFavorite(item.id)}>
        <Ionicons name="heart" size={24} color="#FF6B35" />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  if (favoriteRestaurants.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="heart-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>No favorite restaurants yet</Text>
        <Text style={styles.emptySubtext}>Add restaurants to your favorites to see them here</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favoriteRestaurants}
        renderItem={renderRestaurant}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  listContainer: {
    padding: 16,
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
  },
  restaurantCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  restaurantCuisine: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "600",
  },
  reviewCount: {
    marginLeft: 4,
    fontSize: 12,
    color: "#666",
  },
  favoriteButton: {
    padding: 8,
  },
})
