"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native"
import { supabase } from "../lib/supabase"
import { Ionicons } from "@expo/vector-icons"
import * as Location from "expo-location"

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

export default function RestaurantsScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState("")
  const [favorites, setFavorites] = useState<string[]>([])
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)

  useEffect(() => {
    fetchRestaurants()
    fetchFavorites()
    checkLocationPermission()
  }, [])

  async function checkLocationPermission() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync()
      if (status === "granted") {
        setLocationPermission(true)
        getCurrentLocation()
      } else {
        setLocationPermission(false)
      }
    } catch (error) {
      console.error("Error checking location permission:", error)
      setLocationPermission(false)
    }
  }

  async function requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === "granted") {
        setLocationPermission(true)
        getCurrentLocation()
        Alert.alert("Success", "Location access enabled! You'll now see better restaurant suggestions.")
      } else {
        setLocationPermission(false)
        Alert.alert(
          "Permission Denied",
          "Location access was denied. You can still browse restaurants, but we won't be able to show nearby suggestions.",
        )
      }
    } catch (error) {
      console.error("Error requesting location permission:", error)
    }
  }

  async function getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })
    } catch (error) {
      console.error("Error getting current location:", error)
    }
  }

  async function fetchRestaurants() {
    try {
      const { data, error } = await supabase.from("restaurants").select("*").order("rating", { ascending: false })

      if (error) throw error
      setRestaurants(data || [])
    } catch (error: any) {
      Alert.alert("Error", error.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function fetchFavorites() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase.from("favorites").select("restaurant_id").eq("user_id", user.id)

        if (error) throw error
        setFavorites(data?.map((fav) => fav.restaurant_id) || [])
      }
    } catch (error: any) {
      console.error("Error fetching favorites:", error.message)
    }
  }

  async function toggleFavorite(restaurantId: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const isFavorite = favorites.includes(restaurantId)

      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("restaurant_id", restaurantId)

        if (error) throw error
        setFavorites(favorites.filter((id) => id !== restaurantId))
      } else {
        const { error } = await supabase.from("favorites").insert([{ user_id: user.id, restaurant_id: restaurantId }])

        if (error) throw error
        setFavorites([...favorites, restaurantId])
      }
    } catch (error: any) {
      Alert.alert("Error", error.message)
    }
  }

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRestaurants(restaurants)
    } else {
      const filtered = restaurants.filter(
        (restaurant) =>
          restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          restaurant.cuisine_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          restaurant.address.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredRestaurants(filtered)
    }
  }, [restaurants, searchQuery])

  const onRefresh = () => {
    setRefreshing(true)
    fetchRestaurants()
    fetchFavorites()
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
      <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(item.id)}>
        <Ionicons
          name={favorites.includes(item.id) ? "heart" : "heart-outline"}
          size={24}
          color={favorites.includes(item.id) ? "#FF6B35" : "#fff"}
        />
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nearby Restaurants</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.mapButton} onPress={() => navigation.navigate("Map")}>
            <Ionicons name="map" size={20} color="#FF6B35" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
            <Ionicons name="location" size={20} color="#FF6B35" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Location permission banner */}
      {locationPermission === false && (
        <View style={styles.permissionBanner}>
          <View style={styles.permissionContent}>
            <Ionicons name="location-outline" size={24} color="#FF6B35" />
            <View style={styles.permissionText}>
              <Text style={styles.permissionTitle}>Enable Location</Text>
              <Text style={styles.permissionSubtitle}>Get personalized restaurant recommendations nearby</Text>
            </View>
            <TouchableOpacity style={styles.enableButton} onPress={requestLocationPermission}>
              <Text style={styles.enableButtonText}>Enable</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants, cuisine, or location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredRestaurants}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  headerButtons: {
    flexDirection: "row",
    gap: 10,
  },
  mapButton: {
    padding: 8,
  },
  locationButton: {
    padding: 8,
  },
  permissionBanner: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  permissionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  permissionText: {
    flex: 1,
    marginLeft: 12,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  permissionSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  enableButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  enableButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    padding: 5,
  },
  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 20,
    padding: 8,
    zIndex: 1,
  },
})
