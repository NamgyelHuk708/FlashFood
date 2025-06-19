"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native"
import { supabase } from "../lib/supabase"
import { Ionicons } from "@expo/vector-icons"

interface OwnedRestaurant {
  id: string
  name: string
  cuisine_type: string
  address: string
  phone: string
  email: string
  rating: number
  status: string
  ownership_status: string
  ownership_role: string
  owner_verified: boolean
}

export default function RestaurantOwnerScreen({ navigation }: any) {
  const [ownedRestaurants, setOwnedRestaurants] = useState<OwnedRestaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchOwnedRestaurants()
  }, [])

  async function fetchOwnedRestaurants() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.rpc("get_user_restaurants", {
        user_uuid: user.id,
      })

      if (error) throw error
      setOwnedRestaurants(data || [])
    } catch (error: any) {
      console.error("Error fetching owned restaurants:", error)
      Alert.alert("Error", error.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchOwnedRestaurants()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#4CAF50"
      case "pending":
        return "#FF9800"
      case "rejected":
        return "#F44336"
      case "suspended":
        return "#9E9E9E"
      default:
        return "#666"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Active"
      case "pending":
        return "Pending Approval"
      case "rejected":
        return "Rejected"
      case "suspended":
        return "Suspended"
      default:
        return status
    }
  }

  const renderRestaurantCard = (restaurant: OwnedRestaurant) => (
    <TouchableOpacity
      key={restaurant.id}
      style={styles.restaurantCard}
      onPress={() => navigation.navigate("ManageRestaurant", { restaurant })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.cuisineType}>{restaurant.cuisine_type}</Text>
          <Text style={styles.address}>{restaurant.address}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(restaurant.ownership_status) }]}>
            <Text style={styles.statusText}>{getStatusText(restaurant.ownership_status)}</Text>
          </View>
          {restaurant.owner_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardStats}>
        <View style={styles.statItem}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.statText}>{restaurant.rating}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="person" size={16} color="#666" />
          <Text style={styles.statText}>{restaurant.ownership_role}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </View>
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading your restaurants...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Restaurants</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddRestaurant")}>
          <Ionicons name="add" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      {ownedRestaurants.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No Restaurants Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start by adding your restaurant to Flash Food and reach more customers!
          </Text>
          <TouchableOpacity style={styles.addRestaurantButton} onPress={() => navigation.navigate("AddRestaurant")}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addRestaurantButtonText}>Add Restaurant</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.restaurantsList}>
          <Text style={styles.sectionTitle}>Your Restaurants ({ownedRestaurants.length})</Text>
          {ownedRestaurants.map(renderRestaurantCard)}
        </View>
      )}

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Restaurant Owner Benefits</Text>
        <View style={styles.benefitItem}>
          <Ionicons name="analytics" size={20} color="#FF6B35" />
          <Text style={styles.benefitText}>Track reviews and ratings</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="camera" size={20} color="#FF6B35" />
          <Text style={styles.benefitText}>Upload photos and manage gallery</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="chatbubble" size={20} color="#FF6B35" />
          <Text style={styles.benefitText}>Respond to customer reviews</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="time" size={20} color="#FF6B35" />
          <Text style={styles.benefitText}>Update hours and information</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  addButton: {
    padding: 5,
  },
  restaurantsList: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  restaurantCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  restaurantInfo: {
    flex: 1,
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
    fontSize: 12,
    color: "#666",
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 5,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifiedText: {
    fontSize: 12,
    color: "#4CAF50",
    marginLeft: 4,
  },
  cardStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
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
    marginBottom: 30,
    lineHeight: 22,
  },
  addRestaurantButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6B35",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  addRestaurantButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
  },
})
