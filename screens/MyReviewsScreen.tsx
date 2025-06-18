"use client"

import { useState, useEffect } from "react"
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl, Image } from "react-native"
import { supabase } from "../lib/supabase"
import { Ionicons } from "@expo/vector-icons"

interface Review {
  id: string
  restaurant_id: string
  restaurant_name: string
  restaurant_image_url: string
  rating: number
  comment: string
  created_at: string
}

interface RestaurantData {
  name: string
  image_url: string
}

interface ReviewWithRestaurant {
  id: string
  restaurant_id: string
  rating: number
  comment: string
  created_at: string
  restaurants: RestaurantData | null
}

export default function MyReviewsScreen({ navigation }: any) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchMyReviews()
  }, [])

  async function fetchMyReviews() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Use the function we created earlier, or fallback to direct query
      try {
        const { data, error } = await supabase.rpc("get_user_recent_reviews", {
          user_uuid: user.id,
          limit_count: 100,
        })

        if (error) throw error

        const formattedReviews: Review[] = (data || []).map((review: any) => ({
          id: review.id,
          restaurant_id: review.restaurant_id,
          restaurant_name: review.restaurant_name || "Unknown Restaurant",
          restaurant_image_url: review.restaurant_image_url || "",
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
        }))

        setReviews(formattedReviews)
      } catch (funcError) {
        // Fallback to direct query if function doesn't exist
        const { data, error } = await supabase
          .from("reviews")
          .select(`
            id,
            restaurant_id,
            rating,
            comment,
            created_at,
            restaurants!reviews_restaurant_id_fkey(
              name,
              image_url
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        const reviewsWithRestaurant: Review[] = ((data as any[]) || []).map((review) => ({
          id: review.id,
          restaurant_id: review.restaurant_id,
          restaurant_name: review.restaurants?.name || "Unknown Restaurant",
          restaurant_image_url: review.restaurants?.image_url || "",
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
        }))

        setReviews(reviewsWithRestaurant)
      }
    } catch (error: any) {
      Alert.alert("Error", error.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function deleteReview(reviewId: string) {
    Alert.alert("Delete Review", "Are you sure you want to delete this review?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase.from("reviews").delete().eq("id", reviewId)

            if (error) throw error

            setReviews((prev) => prev.filter((review) => review.id !== reviewId))
            Alert.alert("Success", "Review deleted successfully")
          } catch (error: any) {
            Alert.alert("Error", error.message)
          }
        },
      },
    ])
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchMyReviews()
  }

  const renderStars = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(<Ionicons key={i} name={i <= rating ? "star" : "star-outline"} size={16} color="#FFD700" />)
    }
    return stars
  }

  const renderReview = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <TouchableOpacity
        style={styles.restaurantInfo}
        onPress={() =>
          navigation.navigate("RestaurantDetail", {
            restaurant: { id: item.restaurant_id, name: item.restaurant_name },
          })
        }
      >
        <Image
          source={{ uri: item.restaurant_image_url || "https://via.placeholder.com/60" }}
          style={styles.restaurantImage}
        />
        <View style={styles.restaurantDetails}>
          <Text style={styles.restaurantName}>{item.restaurant_name}</Text>
          <Text style={styles.reviewDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.reviewContent}>
        <View style={styles.reviewHeader}>
          <View style={styles.ratingContainer}>{renderStars(item.rating)}</View>
          <TouchableOpacity style={styles.deleteButton} onPress={() => deleteReview(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#FF6B35" />
          </TouchableOpacity>
        </View>

        <Text style={styles.reviewComment}>{item.comment}</Text>
      </View>
    </View>
  )

  if (reviews.length === 0 && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="star-outline" size={80} color="#ccc" />
        <Text style={styles.emptyTitle}>No Reviews Yet</Text>
        <Text style={styles.emptySubtitle}>Start reviewing restaurants to see them here!</Text>
        <TouchableOpacity style={styles.exploreButton} onPress={() => navigation.navigate("Restaurants")}>
          <Text style={styles.exploreButtonText}>Explore Restaurants</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reviews</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {reviews.length} review{reviews.length !== 1 ? "s" : ""} written
        </Text>
      </View>

      <FlatList
        data={reviews}
        renderItem={renderReview}
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
  statsContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  statsText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  listContainer: {
    padding: 15,
  },
  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantInfo: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  restaurantImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  restaurantDetails: {
    flex: 1,
    justifyContent: "center",
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: "#666",
  },
  reviewContent: {
    padding: 15,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: "row",
  },
  deleteButton: {
    padding: 5,
  },
  reviewComment: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
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
