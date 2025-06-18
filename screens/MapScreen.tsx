"use client"

import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, Alert, TouchableOpacity, Dimensions, ActivityIndicator } from "react-native"
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from "react-native-maps"
import * as Location from "expo-location"
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

const { width, height } = Dimensions.get("window")

export default function MapScreen({ navigation }: any) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([])
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [locationPermission, setLocationPermission] = useState<boolean>(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCuisine, setSelectedCuisine] = useState<string>("All")
  const [minRating, setMinRating] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [dataIssues, setDataIssues] = useState<string[]>([])
  const [region, setRegion] = useState<Region>({
    latitude: 40.7128, // Default to NYC
    longitude: -74.006,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  })
  const mapRef = useRef<MapView>(null)

  useEffect(() => {
    fetchRestaurants()
    requestLocationPermission()
  }, [])

  useEffect(() => {
    filterRestaurants()
  }, [restaurants, selectedCuisine, minRating])

  // Set initial region to show all restaurants when data loads
  useEffect(() => {
    if (restaurants.length > 0) {
      const validRestaurants = restaurants.filter(
        (r) => r.latitude && r.longitude && !isNaN(r.latitude) && !isNaN(r.longitude),
      )

      if (validRestaurants.length > 0) {
        const latitudes = validRestaurants.map((r) => r.latitude)
        const longitudes = validRestaurants.map((r) => r.longitude)

        const minLat = Math.min(...latitudes)
        const maxLat = Math.max(...latitudes)
        const minLng = Math.min(...longitudes)
        const maxLng = Math.max(...longitudes)

        const centerLat = (minLat + maxLat) / 2
        const centerLng = (minLng + maxLng) / 2
        const deltaLat = Math.max((maxLat - minLat) * 1.3, 0.01) // Add padding
        const deltaLng = Math.max((maxLng - minLng) * 1.3, 0.01) // Add padding

        const newRegion = {
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: deltaLat,
          longitudeDelta: deltaLng,
        }

        setRegion(newRegion)
        if (!userLocation) {
          // Only auto-center if user location is not available
          mapRef.current?.animateToRegion(newRegion, 1000)
        }
      }
    }
  }, [restaurants, userLocation])

  async function requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === "granted") {
        setLocationPermission(true)
        getCurrentLocation()
      } else {
        setLocationPermission(false)
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
      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }
      setUserLocation(userCoords)

      // Center map on user location
      const newRegion = {
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
      setRegion(newRegion)
      mapRef.current?.animateToRegion(newRegion, 1000)
    } catch (error) {
      console.error("Error getting current location:", error)
    }
  }

  async function fetchRestaurants() {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("restaurants").select("*").order("rating", { ascending: false })

      if (error) throw error

      console.log("Raw restaurant data from database:", data)

      const issues: string[] = []
      const validRestaurants: Restaurant[] = []
      ;(data || []).forEach((restaurant) => {
        console.log(`Restaurant: ${restaurant.name}`, {
          lat: restaurant.latitude,
          lng: restaurant.longitude,
          address: restaurant.address,
        })

        // Check for coordinate issues
        if (!restaurant.latitude || !restaurant.longitude) {
          issues.push(`${restaurant.name}: Missing coordinates`)
        } else if (restaurant.latitude === 0 && restaurant.longitude === 0) {
          issues.push(`${restaurant.name}: Zero coordinates`)
        } else if (
          isNaN(restaurant.latitude) ||
          isNaN(restaurant.longitude) ||
          restaurant.latitude < -90 ||
          restaurant.latitude > 90 ||
          restaurant.longitude < -180 ||
          restaurant.longitude > 180
        ) {
          issues.push(`${restaurant.name}: Invalid coordinates`)
        } else {
          validRestaurants.push(restaurant)
        }
      })

      if (issues.length > 0) {
        console.warn("Restaurant coordinate issues found:", issues)
        setDataIssues(issues)
        Alert.alert(
          "Coordinate Issues Found",
          `${issues.length} restaurant(s) have coordinate issues:\n\n${issues.slice(0, 3).join("\n")}${
            issues.length > 3 ? `\n...and ${issues.length - 3} more` : ""
          }\n\nThese restaurants won't appear on the map. Please update their coordinates in the database.`,
          [{ text: "OK" }],
        )
      }

      console.log(`Valid restaurants with coordinates: ${validRestaurants.length}/${data?.length || 0}`)
      setRestaurants(validRestaurants)
    } catch (error: any) {
      console.error("Error fetching restaurants:", error)
      Alert.alert("Error", error.message)
    } finally {
      setLoading(false)
    }
  }

  function filterRestaurants() {
    let filtered = restaurants

    if (selectedCuisine !== "All") {
      filtered = filtered.filter((restaurant) => restaurant.cuisine_type === selectedCuisine)
    }

    if (minRating > 0) {
      filtered = filtered.filter((restaurant) => restaurant.rating >= minRating)
    }

    console.log(`Filtered restaurants: ${filtered.length}/${restaurants.length}`)
    setFilteredRestaurants(filtered)
  }

  const onRestaurantPress = (restaurant: Restaurant) => {
    console.log("Restaurant marker pressed:", restaurant.name)
    setSelectedRestaurant(restaurant)
    const newRegion = {
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }
    mapRef.current?.animateToRegion(newRegion, 1000)
  }

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      const newRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
      setRegion(newRegion)
      mapRef.current.animateToRegion(newRegion, 1000)
    } else if (!locationPermission) {
      Alert.alert("Location Required", "Please enable location permissions to use this feature.", [
        { text: "Cancel", style: "cancel" },
        { text: "Settings", onPress: () => requestLocationPermission() },
      ])
    }
  }

  const getUniquesCuisines = () => {
    const cuisines = restaurants.map((r) => r.cuisine_type)
    return ["All", ...Array.from(new Set(cuisines))]
  }

  const renderRestaurantMarkers = () => {
    console.log(`Rendering ${filteredRestaurants.length} restaurant markers`)

    return filteredRestaurants.map((restaurant, index) => {
      return (
        <Marker
          key={restaurant.id}
          coordinate={{
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
          }}
          title={restaurant.name}
          description={`${restaurant.cuisine_type} • ${restaurant.rating}⭐`}
          onPress={() => onRestaurantPress(restaurant)}
        >
          <View style={styles.markerContainer}>
            <View style={[styles.marker, { backgroundColor: getMarkerColor(restaurant.rating) }]}>
              <Ionicons name="restaurant" size={20} color="#fff" />
            </View>
            <Text style={styles.markerRating}>{restaurant.rating}</Text>
          </View>
        </Marker>
      )
    })
  }

  const getMarkerColor = (rating: number) => {
    if (rating >= 4.5) return "#4CAF50" // Green for excellent
    if (rating >= 4.0) return "#FF6B35" // Orange for good
    if (rating >= 3.0) return "#FFC107" // Yellow for average
    return "#F44336" // Red for below average
  }

  const renderUserLocationMarker = () => {
    if (!userLocation) return null

    return (
      <Marker coordinate={userLocation} title="Your Location" description="You are here" anchor={{ x: 0.5, y: 0.5 }}>
        <View style={styles.userLocationMarker}>
          <View style={styles.userLocationDot} />
        </View>
      </Marker>
    )
  }

  const renderFilters = () => {
    if (!showFilters) return null

    return (
      <View style={styles.filtersContainer}>
        <View style={styles.filtersScroll}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Cuisine:</Text>
            <View style={styles.filterChipsContainer}>
              {getUniquesCuisines().map((cuisine) => (
                <TouchableOpacity
                  key={cuisine}
                  style={[styles.filterChip, selectedCuisine === cuisine && styles.filterChipActive]}
                  onPress={() => setSelectedCuisine(cuisine)}
                >
                  <Text style={[styles.filterChipText, selectedCuisine === cuisine && styles.filterChipTextActive]}>
                    {cuisine}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Min Rating:</Text>
            <View style={styles.ratingFilters}>
              {[0, 3, 4, 4.5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[styles.ratingChip, minRating === rating && styles.filterChipActive]}
                  onPress={() => setMinRating(rating)}
                >
                  <Text style={[styles.filterChipText, minRating === rating && styles.filterChipTextActive]}>
                    {rating === 0 ? "All" : `${rating}+⭐`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading restaurants...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        mapType="standard"
      >
        {renderRestaurantMarkers()}
        {renderUserLocationMarker()}
      </MapView>

      {/* Control buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, showFilters && styles.controlButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options" size={24} color={showFilters ? "#fff" : "#FF6B35"} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={centerOnUser}>
          <Ionicons name="locate" size={24} color="#FF6B35" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={() => navigation.navigate("Restaurants")}>
          <Ionicons name="list" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {renderFilters()}

      {/* Restaurant count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? "s" : ""} shown
          {dataIssues.length > 0 && (
            <Text style={styles.issuesText}> • {dataIssues.length} with coordinate issues</Text>
          )}
        </Text>
      </View>

      {/* Restaurant info card */}
      {selectedRestaurant && (
        <View style={styles.restaurantCard}>
          <TouchableOpacity
            style={styles.cardContent}
            onPress={() => navigation.navigate("RestaurantDetail", { restaurant: selectedRestaurant })}
          >
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{selectedRestaurant.name}</Text>
              <Text style={styles.cardCuisine}>{selectedRestaurant.cuisine_type}</Text>
              <Text style={styles.cardAddress}>{selectedRestaurant.address}</Text>
              <View style={styles.cardRating}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>{selectedRestaurant.rating}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedRestaurant(null)}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}

      {/* Location permission banner */}
      {!locationPermission && (
        <View style={styles.permissionBanner}>
          <Text style={styles.permissionText}>Enable location for better restaurant suggestions</Text>
          <TouchableOpacity style={styles.enableButton} onPress={requestLocationPermission}>
            <Text style={styles.enableButtonText}>Enable</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  markerContainer: {
    alignItems: "center",
  },
  marker: {
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerRating: {
    backgroundColor: "#fff",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: "bold",
    color: "#333",
    marginTop: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  userLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0, 122, 255, 0.3)",
    borderWidth: 2,
    borderColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  userLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
  },
  controlsContainer: {
    position: "absolute",
    top: 50,
    right: 20,
    gap: 10,
  },
  controlButton: {
    backgroundColor: "#fff",
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  controlButtonActive: {
    backgroundColor: "#FF6B35",
  },
  filtersContainer: {
    position: "absolute",
    top: 120,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filtersScroll: {
    paddingHorizontal: 15,
  },
  filterSection: {
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  filterChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: "#FF6B35",
  },
  filterChipText: {
    fontSize: 12,
    color: "#666",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  ratingFilters: {
    flexDirection: "row",
    gap: 8,
  },
  ratingChip: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  countText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "bold",
  },
  issuesText: {
    color: "#FF6B35",
  },
  restaurantCard: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardContent: {
    flexDirection: "row",
    padding: 15,
    alignItems: "center",
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  cardCuisine: {
    fontSize: 14,
    color: "#FF6B35",
    marginBottom: 4,
  },
  cardAddress: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  cardRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#666",
  },
  closeButton: {
    padding: 8,
  },
  permissionBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FF6B35",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    paddingTop: 50,
  },
  permissionText: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
  },
  enableButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  enableButtonText: {
    color: "#FF6B35",
    fontSize: 14,
    fontWeight: "bold",
  },
})
