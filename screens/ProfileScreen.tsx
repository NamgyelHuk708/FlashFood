"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native"
import { supabase } from "../lib/supabase"
import { Ionicons } from "@expo/vector-icons"

interface RecentReview {
  id: string
  rating: number
  comment: string
  created_at: string
  restaurants: {
    name: string
  } | null
}

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([])

  useEffect(() => {
    getProfile()
    getStats()
    getRecentReviews()
  }, [])

  async function getProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    } catch (error: any) {
      Alert.alert("Error", error.message)
    }
  }

  async function getStats() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        // Get review count
        const { count: reviewCount, error: reviewError } = await supabase
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        if (reviewError) throw reviewError
        setReviewCount(reviewCount || 0)

        // Get favorite count
        const { count: favoriteCount, error: favoriteError } = await supabase
          .from("favorites")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        if (favoriteError) throw favoriteError
        setFavoriteCount(favoriteCount || 0)
      }
    } catch (error: any) {
      console.error("Error getting stats:", error.message)
    }
  }

  async function getRecentReviews() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from("reviews")
          .select(`
            id,
            rating,
            comment,
            created_at,
            restaurants!reviews_restaurant_id_fkey(name)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3)

        if (error) throw error
        setRecentReviews((data as any[]) || [])
      }
    } catch (error: any) {
      console.error("Error getting recent reviews:", error.message)
    }
  }

  async function signOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.auth.signOut()
          if (error) Alert.alert("Error", error.message)
        },
      },
    ])
  }

  const renderStars = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(<Ionicons key={i} name={i <= rating ? "star" : "star-outline"} size={14} color="#FFD700" />)
    }
    return stars
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={80} color="#FF6B35" />
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.memberSince}>
          Member since {user?.created_at ? new Date(user.created_at).getFullYear() : "2024"}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{reviewCount}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{favoriteCount}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
      </View>

      {/* Recent Reviews Section */}
      {recentReviews.length > 0 && (
        <View style={styles.recentReviewsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
            <TouchableOpacity onPress={() => navigation.navigate("MyReviews")}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentReviews.map((review) => (
            <View key={review.id} style={styles.reviewPreview}>
              <View style={styles.reviewPreviewHeader}>
                <Text style={styles.restaurantName}>{review.restaurants?.name || "Unknown Restaurant"}</Text>
                <View style={styles.ratingContainer}>{renderStars(review.rating)}</View>
              </View>
              <Text style={styles.reviewComment} numberOfLines={2}>
                {review.comment}
              </Text>
              <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Favorites")}>
          <Ionicons name="heart" size={24} color="#FF6B35" />
          <Text style={styles.menuText}>Favorite Restaurants</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("MyReviews")}>
          <Ionicons name="star" size={24} color="#FF6B35" />
          <Text style={styles.menuText}>My Reviews</Text>
          {reviewCount > 0 && (
            <View style={styles.menuBadge}>
              <Text style={styles.menuBadgeText}>{reviewCount}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings" size={24} color="#FF6B35" />
          <Text style={styles.menuText}>Settings</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle" size={24} color="#FF6B35" />
          <Text style={styles.menuText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Ionicons name="log-out" size={24} color="#fff" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    alignItems: "center",
    padding: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatarContainer: {
    marginBottom: 15,
  },
  email: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  memberSince: {
    fontSize: 14,
    color: "#666",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginTop: 10,
    paddingVertical: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6B35",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  recentReviewsContainer: {
    backgroundColor: "#fff",
    marginTop: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  seeAllText: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "bold",
  },
  reviewPreview: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  reviewPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
  },
  reviewComment: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
    lineHeight: 16,
  },
  reviewDate: {
    fontSize: 10,
    color: "#999",
  },
  menuContainer: {
    backgroundColor: "#fff",
    marginTop: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
  },
  menuBadge: {
    backgroundColor: "#FF6B35",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 10,
  },
  menuBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B35",
    margin: 20,
    padding: 15,
    borderRadius: 8,
  },
  signOutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
})
