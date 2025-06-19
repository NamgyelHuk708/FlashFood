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

interface Restaurant {
  id: string
  name: string
  cuisine_type: string
  address: string
  phone: string
  email: string
  website: string
  description: string
  rating: number
  status: string
  owner_verified: boolean
  ownership_status: string
}

interface RestaurantStats {
  totalReviews: number
  averageRating: number
  recentReviews: any[]
  monthlyViews: number
}

export default function ManageRestaurantScreen({ route, navigation }: any) {
  const { restaurant: initialRestaurant } = route.params
  const [restaurant, setRestaurant] = useState<Restaurant>(initialRestaurant)
  const [stats, setStats] = useState<RestaurantStats>({
    totalReviews: 0,
    averageRating: 0,
    recentReviews: [],
    monthlyViews: 0,
  })
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchRestaurantStats()
  }, [])

  async function fetchRestaurantStats() {
    try {
      setLoading(true)

      // Get review stats
      const { data: reviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, profiles!reviews_user_id_fkey_profiles(username)")
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false })
        .limit(5)

      if (reviewsError) throw reviewsError

      const totalReviews = reviews?.length || 0
      const averageRating = totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0

      setStats({
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        recentReviews: reviews || [],
        monthlyViews: Math.floor(Math.random() * 500) + 100, // Mock data
      })
    } catch (error: any) {
      Alert.alert("Error", error.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchRestaurantStats()
  }

  const renderStars = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(<Ionicons key={i} name={i <= rating ? "star" : "star-outline"} size={14} color="#FFD700" />)
    }
    return stars
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#4CAF50"
      case "pending":
        return "#FF9800"
      case "inactive":
        return "#9E9E9E"
      case "suspended":
        return "#F44336"
      default:
        return "#666"
    }
  }

  const menuItems = [
    {
      title: "Edit Restaurant Info",
      subtitle: "Update name, address, hours, etc.",
      icon: "create",
      onPress: () => navigation.navigate("EditRestaurant", { restaurant }),
    },
    {
      title: "Manage Photos",
      subtitle: "Upload and organize restaurant photos",
      icon: "camera",
      onPress: () => navigation.navigate("ManagePhotos", { restaurant }),
    },
    {
      title: "Reviews & Responses",
      subtitle: `${stats.totalReviews} reviews • Respond to customers`,
      icon: "chatbubbles",
      onPress: () => navigation.navigate("ManageReviews", { restaurant }),
    },
    {
      title: "Business Hours",
      subtitle: "Set opening hours and special schedules",
      icon: "time",
      onPress: () => navigation.navigate("BusinessHours", { restaurant }),
    },
    {
      title: "Analytics",
      subtitle: "View performance and insights",
      icon: "analytics",
      onPress: () => navigation.navigate("RestaurantAnalytics", { restaurant }),
    },
  ]

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Restaurant</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Restaurant Overview */}
      <View style={styles.overviewCard}>
        <View style={styles.restaurantHeader}>
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <Text style={styles.cuisineType}>{restaurant.cuisine_type}</Text>
            <Text style={styles.address}>{restaurant.address}</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(restaurant.status) }]}>
              <Text style={styles.statusText}>{restaurant.status}</Text>
            </View>
            {restaurant.owner_verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.averageRating}</Text>
            <View style={styles.starsContainer}>{renderStars(Math.round(stats.averageRating))}</View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalReviews}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.monthlyViews}</Text>
            <Text style={styles.statLabel}>Monthly Views</Text>
          </View>
        </View>
      </View>

      {/* Management Menu */}
      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Restaurant Management</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon as any} size={24} color="#FF6B35" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Reviews */}
      {stats.recentReviews.length > 0 && (
        <View style={styles.reviewsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
            <TouchableOpacity onPress={() => navigation.navigate("ManageReviews", { restaurant })}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {stats.recentReviews.slice(0, 3).map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewUser}>@{review.profiles?.username || "Anonymous"}</Text>
                <View style={styles.reviewRating}>{renderStars(review.rating)}</View>
              </View>
              <Text style={styles.reviewComment} numberOfLines={2}>
                {review.comment}
              </Text>
              <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
            </View>
          ))}
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      )}
    </ScrollView>
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
  moreButton: {
    padding: 5,
  },
  overviewCard: {
    backgroundColor: "#fff",
    margin: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 20,
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
    textTransform: "capitalize",
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
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6B35",
  },
  starsContainer: {
    flexDirection: "row",
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  menuContainer: {
    backgroundColor: "#fff",
    margin: 15,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  reviewsContainer: {
    backgroundColor: "#fff",
    margin: 15,
    borderRadius: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "bold",
  },
  reviewCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  reviewRating: {
    flexDirection: "row",
  },
  reviewComment: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    color: "#999",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
})
