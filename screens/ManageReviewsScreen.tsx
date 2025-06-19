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
  TextInput,
  Modal,
} from "react-native"
import { supabase } from "../lib/supabase"
import { Ionicons } from "@expo/vector-icons"

interface Review {
  id: string
  user_id: string
  rating: number
  comment: string
  created_at: string
  owner_response: string | null
  owner_response_date: string | null
  user_email: string
  user_full_name: string
  user_username: string
  user_avatar_url: string
}

interface Restaurant {
  id: string
  name: string
}

export default function ManageReviewsScreen({ route, navigation }: any) {
  const { restaurant } = route.params
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState("")
  const [submittingResponse, setSubmittingResponse] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [])

  async function fetchReviews() {
    try {
      const { data, error } = await supabase.rpc("get_reviews_with_profiles", {
        restaurant_uuid: restaurant.id,
      })

      if (error) throw error

      const reviewsWithUserInfo =
        data?.map((review: any) => ({
          ...review,
          user_email: review.user_email || "Anonymous",
          user_full_name: review.user_full_name || "Anonymous User",
          user_username: review.user_username || null,
          user_avatar_url: review.user_avatar_url,
        })) || []

      setReviews(reviewsWithUserInfo)
    } catch (error: any) {
      console.error("Error fetching reviews:", error)
      Alert.alert("Error", error.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function submitResponse(reviewId: string) {
    if (!responseText.trim()) {
      Alert.alert("Error", "Please enter a response")
      return
    }

    setSubmittingResponse(true)
    try {
      const { data, error } = await supabase.rpc("add_owner_response", {
        review_uuid: reviewId,
        response_text: responseText.trim(),
        restaurant_uuid: restaurant.id,
      })

      if (error) throw error

      if (data) {
        setRespondingTo(null)
        setResponseText("")
        fetchReviews()
        Alert.alert("Success", "Response added successfully!")
      } else {
        Alert.alert("Error", "You don't have permission to respond to this review")
      }
    } catch (error: any) {
      Alert.alert("Error", error.message)
    } finally {
      setSubmittingResponse(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchReviews()
  }

  const renderStars = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(<Ionicons key={i} name={i <= rating ? "star" : "star-outline"} size={16} color="#FFD700" />)
    }
    return stars
  }

  const renderUserAvatar = (review: Review) => {
    const displayName = review.user_username
      ? `@${review.user_username}`
      : review.user_full_name || review.user_email || "Anonymous"

    return (
      <View style={styles.userAvatarPlaceholder}>
        <Ionicons name="person" size={20} color="#666" />
      </View>
    )
  }

  const renderReview = (review: Review) => (
    <View key={review.id} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUserInfo}>
          {renderUserAvatar(review)}
          <View style={styles.reviewUserDetails}>
            <Text style={styles.reviewUserName}>
              {review.user_username
                ? `@${review.user_username}`
                : review.user_full_name || review.user_email || "Anonymous"}
            </Text>
            <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
        <View style={styles.reviewRating}>{renderStars(review.rating)}</View>
      </View>

      <Text style={styles.reviewComment}>{review.comment}</Text>

      {/* Owner Response */}
      {review.owner_response ? (
        <View style={styles.ownerResponseContainer}>
          <View style={styles.ownerResponseHeader}>
            <Ionicons name="business" size={16} color="#FF6B35" />
            <Text style={styles.ownerResponseLabel}>Owner Response</Text>
            <Text style={styles.ownerResponseDate}>{new Date(review.owner_response_date!).toLocaleDateString()}</Text>
          </View>
          <Text style={styles.ownerResponseText}>{review.owner_response}</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.respondButton}
          onPress={() => {
            setRespondingTo(review.id)
            setResponseText("")
          }}
        >
          <Ionicons name="chatbubble" size={16} color="#FF6B35" />
          <Text style={styles.respondButtonText}>Respond to Review</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews & Responses</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{restaurant.name}</Text>
        <Text style={styles.reviewCount}>
          {reviews.length} review{reviews.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Reviews Yet</Text>
            <Text style={styles.emptySubtitle}>
              When customers leave reviews, you'll be able to respond to them here.
            </Text>
          </View>
        ) : (
          <View style={styles.reviewsList}>{reviews.map(renderReview)}</View>
        )}
      </ScrollView>

      {/* Response Modal */}
      <Modal visible={respondingTo !== null} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setRespondingTo(null)
                setResponseText("")
              }}
            >
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Respond to Review</Text>
            <TouchableOpacity
              onPress={() => respondingTo && submitResponse(respondingTo)}
              disabled={submittingResponse || !responseText.trim()}
            >
              <Text
                style={[styles.submitButton, (submittingResponse || !responseText.trim()) && styles.disabledButton]}
              >
                {submittingResponse ? "Sending..." : "Send"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.responseLabel}>Your Response</Text>
            <TextInput
              style={styles.responseInput}
              multiline
              numberOfLines={6}
              placeholder="Thank you for your review! We appreciate your feedback..."
              value={responseText}
              onChangeText={setResponseText}
              maxLength={500}
            />
            <Text style={styles.characterCount}>{responseText.length}/500</Text>

            <View style={styles.responseGuidelines}>
              <Text style={styles.guidelinesTitle}>Response Guidelines:</Text>
              <Text style={styles.guidelineText}>• Be professional and courteous</Text>
              <Text style={styles.guidelineText}>• Thank customers for their feedback</Text>
              <Text style={styles.guidelineText}>• Address specific concerns mentioned</Text>
              <Text style={styles.guidelineText}>• Invite them to visit again</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  placeholder: {
    width: 34,
  },
  restaurantInfo: {
    backgroundColor: "#fff",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  reviewCount: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  reviewsList: {
    padding: 15,
  },
  reviewCard: {
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
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  reviewUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
    marginBottom: 15,
    lineHeight: 20,
  },
  ownerResponseContainer: {
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#FF6B35",
  },
  ownerResponseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ownerResponseLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FF6B35",
    marginLeft: 5,
    flex: 1,
  },
  ownerResponseDate: {
    fontSize: 10,
    color: "#999",
  },
  ownerResponseText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 18,
  },
  respondButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF3E0",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF6B35",
  },
  respondButtonText: {
    color: "#FF6B35",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
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
    lineHeight: 22,
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
    paddingTop: 50,
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
    flex: 1,
    padding: 20,
  },
  responseLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  responseInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 120,
  },
  characterCount: {
    textAlign: "right",
    fontSize: 12,
    color: "#999",
    marginTop: 5,
    marginBottom: 20,
  },
  responseGuidelines: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  guidelineText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
})
