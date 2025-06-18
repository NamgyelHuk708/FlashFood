"use client"

import { useState, useEffect } from "react"
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert, RefreshControl } from "react-native"
import { supabase } from "../lib/supabase"
import { Ionicons } from "@expo/vector-icons"

interface Restaurant {
  id: string
  name: string
  cuisine_type: string
  address: string
  rating: number
  image_url: string
  latitude: number
  longitude: number
}

export default function FavoritesScreen({ navigation }: any) {
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchFavoriteRestaurants()
  }, [])

  async function fetchFavoriteRestaurants() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from("favorites")
          .select(`
            restaurant_id,
            restaurants (
              id,
              name,
              cuisine_type,
              address,
              rating,
              image_url,
              latitude,
              longitude
            )
          `)
          .eq("user_id", user.id)

        if (error) throw error

        const restaurants = data?.map((fav) => fav.restaurants).filter(Boolean) || []
        setFavoriteRestaurants(restaurants as Restaurant[])
      }
    } catch (error: any) {
      Alert.alert("Error", error.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function removeFavorite(restaurantId: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("restaurant_id", restaurantId)

      if (error) throw error

      setFavoriteRestaurants((prev) => prev.filter((restaurant) => restaurant.id !== restaurantId))
      Alert.alert("Removed", "Restaurant removed from favorites")
    } catch (error: any) {
      Alert.alert("Error", error.message)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchFavoriteRestaurants()
  }

  const renderStars = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(<Ionicons key={i} name={i <= rating ? "star" : "star-outline"} size={16} color="#FFD700" />)
    }
    return stars
  }

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={styles.restaurantCard}
      onPress={() => navigation.navigate("RestaurantDetail", { restaurant: item })}
    >
      <Image source={{ uri: item.image_url || "https://via.placeholder.com/150" }} style={styles.restaurantImage} />
      <TouchableOpacity style={styles.removeButton} onPress={() => removeFavorite(item.id)}>
        <Ionicons name="heart" size={24} color="#FF6B35" />
      </TouchableOpacity>
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{item.name}</Text>
        <Text style={styles.cuisineType}>{item.cuisine_type}</Text>
        <Text style={styles.address}>{item.address}</Text>
        <View style={styles.ratingContainer}>
          {renderStars(item.rating)}
          <Text style={styles.ratingText}>({item.rating})</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  if (favoriteRestaurants.length === 0 && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="heart-outline" size={80} color="#ccc" />
        <Text style={styles.emptyTitle}>No Favorites Yet</Text>
        <Text style={styles.emptySubtitle}>Start adding restaurants to your favorites!</Text>
        <TouchableOpacity style={styles.exploreButton} onPress={() => navigation.navigate("Restaurants")}>
          <Text style={styles.exploreButtonText}>Explore Restaurants</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Favorites</Text>
        <Text style={styles.headerSubtitle}>{favoriteRestaurants.length} restaurants</Text>
      </View>

      <FlatList
        data={favoriteRestaurants}
        renderItem={renderRestaurant}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  listContainer: {
    padding: 15,
  },
  restaurantCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantImage: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  removeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 8,
    zIndex: 1,
  },
  restaurantInfo: {
    padding: 15,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  cuisineType: {
    fontSize: 14,
    color: "#FF6B35",
    marginBottom: 5,
  },
  address: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  exploreButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
