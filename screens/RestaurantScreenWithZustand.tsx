"use client"

// PRESENTATION LAYER - Updated Restaurants Screen using Zustand
import { useState, useEffect } from "react"
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as Location from "expo-location"
import { useRestaurantsWithZustand } from "../hooks/useRestaurantWithZustand"
import { useUserPreferencesStore } from "../stores/userPreferenceStore"
import RestaurantCard from "../components/ui/RestaurantCard"
import SearchBar from "../components/ui/SearchBar"
import FilterChips from "../components/ui/FilterChips"
import LoadingSpinner from "../components/ui/LoadingSpinner"

export default function RestaurantsScreenWithZustand({ navigation }: any) {
  const [showFilters, setShowFilters] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Zustand stores
  const {
    restaurants,
    favorites,
    filters,
    loading,
    error,
    updateFilters,
    clearFilters,
    toggleFavorite,
    refetch,
    hasActiveFilters,
    filterSummary,
  } = useRestaurantsWithZustand()

  const { locationPermissionGranted, userLocation, setLocationPermission, setUserLocation } = useUserPreferencesStore()

  useEffect(() => {
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
        Alert.alert("Success", "Location access enabled!")
      } else {
        setLocationPermission(false)
        Alert.alert("Permission Denied", "Location access was denied.")
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

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const handleSearch = (query: string) => {
    updateFilters({ searchQuery: query })
  }

  const clearSearch = () => {
    updateFilters({ searchQuery: "" })
  }

  const handleFavoritePress = (restaurantId: string) => {
    toggleFavorite(restaurantId)
  }

  const renderRestaurant = ({ item }: { item: any }) => (
    <RestaurantCard
      restaurant={item}
      isFavorite={favorites.includes(item.id)}
      onPress={() => navigation.navigate("RestaurantDetail", { restaurant: item })}
      onFavoritePress={() => handleFavoritePress(item.id)}
    />
  )

  if (loading && restaurants.length === 0) {
    return <LoadingSpinner message="Loading restaurants..." />
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color="#FF6B35" />
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    )
  }

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
      {!locationPermissionGranted && (
        <View style={styles.permissionBanner}>
          <View style={styles.permissionContent}>
            <Ionicons name="location-outline" size={24} color="#FF6B35" />
            <View style={styles.permissionText}>
              <Text style={styles.permissionTitle}>Enable Location</Text>
              <Text style={styles.permissionSubtitle}>Get personalized restaurant recommendations</Text>
            </View>
            <TouchableOpacity style={styles.enableButton} onPress={requestLocationPermission}>
              <Text style={styles.enableButtonText}>Enable</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <SearchBar
        value={filters.searchQuery || ""}
        onChangeText={handleSearch}
        onClear={clearSearch}
        placeholder="Search restaurants, cuisine, or location..."
      />

      {/* Filter toggle */}
      <View style={styles.filterToggleContainer}>
        <TouchableOpacity
          style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options" size={16} color={showFilters ? "#fff" : "#FF6B35"} />
          <Text style={[styles.filterToggleText, showFilters && styles.filterToggleTextActive]}>
            Filters {hasActiveFilters && `(${filterSummary})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <FilterChips
          selectedCuisine={filters.cuisine}
          selectedRating={filters.minRating}
          onCuisineChange={(cuisine) => updateFilters({ cuisine })}
          onRatingChange={(rating) => updateFilters({ minRating: rating })}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      <FlatList
        data={restaurants}
        renderItem={renderRestaurant}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No restaurants found</Text>
            <Text style={styles.emptySubtitle}>
              {hasActiveFilters ? "Try adjusting your filters" : "Check back later for new restaurants"}
            </Text>
          </View>
        }
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
  filterToggleContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FF6B35",
    alignSelf: "flex-start",
  },
  filterToggleActive: {
    backgroundColor: "#FF6B35",
  },
  filterToggleText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "bold",
  },
  filterToggleTextActive: {
    color: "#fff",
  },
  listContainer: {
    padding: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 50,
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
