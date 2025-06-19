"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Alert, TextInput, Modal } from "react-native"
import { supabase } from "../lib/supabase"
import { Ionicons } from "@expo/vector-icons"

interface Review {
  user_username: string
  id: string
  user_id: string
  rating: number
  comment: string
  created_at: string
  user_email: string
  user_full_name: string
  user_avatar_url: string
}

export default function RestaurantDetailScreen({ route, navigation }: any) {
  const { restaurant } = route.params
  const [reviews, setReviews] = useState<Review[]>([])
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    fetchReviews()
    checkFavoriteStatus()
  }, [])

  async function fetchReviews() {
    try {
      // Use the new function to get reviews with profile information
      const { data, error } = await supabase.rpc("get_reviews_with_profiles", {
        restaurant_uuid: restaurant.id,
      })

      if (error) throw error

      const reviewsWithUserInfo =
        data?.map((review: any) => ({
          ...review,
          user_email: review.user_email || "Anonymous",
          user_full_name: review.user_full_name || "Anonymous User",
          user_avatar_url: review.user_avatar_url,
        })) || []

      setReviews(reviewsWithUserInfo)
    } catch (error: any) {
      console.error("Error fetching reviews:", error)
      // Fallback to the old method if the function doesn't exist yet
      try {
        const { data, error: fallbackError } = await supabase
          .from("reviews")
          .select(`
            *,
            profiles!reviews_user_id_fkey_profiles(email, full_name, avatar_url)
          `)
          .eq("restaurant_id", restaurant.id)
          .order("created_at", { ascending: false })

        if (fallbackError) throw fallbackError

        const reviewsWithUserInfo =
          data?.map((review) => ({
            ...review,
            user_email: review.profiles?.email || "Anonymous",
            user_full_name: review.profiles?.full_name || "Anonymous User",
            user_avatar_url: review.profiles?.avatar_url,
          })) || []

        setReviews(reviewsWithUserInfo)
      } catch (fallbackError: any) {
        Alert.alert("Error", fallbackError.message)
      }
    }
  }

  async function checkFavoriteStatus() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from("favorites")
          .select("id")
          .eq("user_id", user.id)
          .eq("restaurant_id", restaurant.id)
          .single()

        if (error && error.code !== "PGRST116") throw error
        setIsFavorite(!!data)
      }
    } catch (error: any) {
      console.error("Error checking favorite status:", error.message)
    }
  }

  async function toggleFavorite() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("restaurant_id", restaurant.id)

        if (error) throw error
        setIsFavorite(false)
        Alert.alert("Removed", "Restaurant removed from favorites")
      } else {
        const { error } = await supabase.from("favorites").insert([{ user_id: user.id, restaurant_id: restaurant.id }])

        if (error) throw error
        setIsFavorite(true)
        Alert.alert("Added", "Restaurant added to favorites")
      }
    } catch (error: any) {
      Alert.alert("Error", error.message)
    }
  }

  async function submitReview() {
    if (!newComment.trim()) {
      Alert.alert("Error", "Please enter a comment")
      return
    }

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        Alert.alert("Error", "You must be logged in to submit a review")
        return
      }

      // Ensure user has a profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single()

      if (profileError && profileError.code === "PGRST116") {
        // Create profile if it doesn't exist
        const { error: createProfileError } = await supabase
          .from("profiles")
          .insert([{ id: user.id, email: user.email }])

        if (createProfileError) throw createProfileError
      }

      const { error } = await supabase.from("reviews").insert([
        {
          restaurant_id: restaurant.id,
          user_id: user.id,
          rating: newRating,
          comment: newComment.trim(),
        },
      ])

      if (error) throw error

      setShowReviewModal(false)
      setNewComment("")
      setNewRating(5)
      fetchReviews()
      Alert.alert("Success", "Review submitted successfully!")
    } catch (error: any) {
      Alert.alert("Error", error.message)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number, onPress?: (rating: number) => void) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => onPress?.(i)} disabled={!onPress}>
          <Ionicons name={i <= rating ? "star" : "star-outline"} size={onPress ? 30 : 16} color="#FFD700" />
        </TouchableOpacity>,
      )
    }
    return stars
  }

  const openMaps = () => {
    const url = `https://maps.google.com/?q=${restaurant.latitude},${restaurant.longitude}`
    Alert.alert("Open Maps", "This would open the location in your maps app", [{ text: "OK" }])
  }

  const renderUserAvatar = (review: Review) => {
    const displayName = review.user_full_name || review.user_username || review.user_email || "Anonymous"

    if (review.user_avatar_url) {
      return <Image source={{ uri: review.user_avatar_url }} style={styles.userAvatar} />
    }
    return (
      <View style={styles.userAvatarPlaceholder}>
        <Ionicons name="person" size={20} color="#666" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: restaurant.image_url || "https://via.placeholder.com/400" }} style={styles.headerImage} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{restaurant.name}</Text>
          <View style={styles.ratingContainer}>
            {renderStars(restaurant.rating)}
            <Text style={styles.ratingText}>({restaurant.rating})</Text>
          </View>
        </View>

        <Text style={styles.cuisineType}>{restaurant.cuisine_type}</Text>

        <TouchableOpacity style={styles.addressContainer} onPress={openMaps}>
          <Ionicons name="location" size={20} color="#FF6B35" />
          <Text style={styles.address}>{restaurant.address}</Text>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={20} color="#fff" />
            <Text style={styles.buttonText}>{isFavorite ? "Remove Favorite" : "Add to Favorites"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.reviewButton} onPress={() => setShowReviewModal(true)}>
            <Ionicons name="star" size={20} color="#fff" />
            <Text style={styles.buttonText}>Write Review</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>

          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewUserInfo}>
                  {renderUserAvatar(review)}
                  <View style={styles.reviewUserDetails}>
                    <Text style={styles.reviewUserName}>
                      {review.user_username ? `@${review.user_username}` : review.user_full_name || review.user_email}
                    </Text>
                    <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
                <View style={styles.reviewRating}>{renderStars(review.rating)}</View>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))}

          {reviews.length === 0 && <Text style={styles.noReviews}>No reviews yet. Be the first to review!</Text>}
        </View>
      </View>

      <Modal visible={showReviewModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowReviewModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Write Review</Text>
            <TouchableOpacity onPress={submitReview} disabled={loading}>
              <Text style={[styles.submitButton, loading && styles.disabledButton]}>
                {loading ? "Submitting..." : "Submit"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.ratingLabel}>Rating</Text>
            <View style={styles.starContainer}>{renderStars(newRating, setNewRating)}</View>

            <Text style={styles.commentLabel}>Comment</Text>
            <TextInput
              style={styles.commentInput}
              multiline
              numberOfLines={4}
              placeholder="Share your experience..."
              value={newComment}
              onChangeText={setNewComment}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerImage: {
    width: "100%",
    height: 250,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
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
  cuisineType: {
    fontSize: 16,
    color: "#FF6B35",
    marginBottom: 15,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  address: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  actionButtons: {
    marginBottom: 30,
  },
  reviewButton: {
    backgroundColor: "#FF6B35",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  reviewsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
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
    alignItems: "flex-start",
    marginBottom: 8,
  },
  reviewUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  reviewUserDetails: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  reviewDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  reviewRating: {
    flexDirection: "row",
  },
  reviewComment: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    lineHeight: 20,
  },
  noReviews: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  cancelButton: {
    color: "#666",
    fontSize: 16,
  },
  submitButton: {
    color: "#FF6B35",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalContent: {
    padding: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  starContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    textAlignVertical: "top",
  },
  favoriteButton: {
    backgroundColor: "#FF6B35",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
})
