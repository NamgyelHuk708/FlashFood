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
  Image,
  Dimensions,
} from "react-native"
import { supabase } from "../lib/supabase"
import { Ionicons } from "@expo/vector-icons"

const { width } = Dimensions.get("window")
const photoWidth = (width - 60) / 2 // 2 photos per row with margins

interface RestaurantPhoto {
  id: string
  photo_url: string
  caption: string
  is_primary: boolean
  created_at: string
}

interface Restaurant {
  id: string
  name: string
  image_url: string
}

export default function ManagePhotosScreen({ route, navigation }: any) {
  const { restaurant } = route.params
  const [photos, setPhotos] = useState<RestaurantPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchPhotos()
  }, [])

  async function fetchPhotos() {
    try {
      const { data, error } = await supabase
        .from("restaurant_photos")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) throw error
      setPhotos(data || [])
    } catch (error: any) {
      Alert.alert("Error", error.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function setPrimaryPhoto(photoId: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Check ownership
      const { data: ownership, error: ownershipError } = await supabase
        .from("restaurant_owners")
        .select("id")
        .eq("user_id", user.id)
        .eq("restaurant_id", restaurant.id)
        .eq("status", "approved")
        .single()

      if (ownershipError || !ownership) {
        throw new Error("You don't have permission to manage this restaurant's photos")
      }

      // Remove primary flag from all photos
      await supabase.from("restaurant_photos").update({ is_primary: false }).eq("restaurant_id", restaurant.id)

      // Set new primary photo
      const { error } = await supabase.from("restaurant_photos").update({ is_primary: true }).eq("id", photoId)

      if (error) throw error

      // Update restaurant's main image_url
      const selectedPhoto = photos.find((p) => p.id === photoId)
      if (selectedPhoto) {
        await supabase.from("restaurants").update({ image_url: selectedPhoto.photo_url }).eq("id", restaurant.id)
      }

      fetchPhotos()
      Alert.alert("Success", "Primary photo updated!")
    } catch (error: any) {
      Alert.alert("Error", error.message)
    }
  }

  async function deletePhoto(photoId: string) {
    Alert.alert("Delete Photo", "Are you sure you want to delete this photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase.from("restaurant_photos").delete().eq("id", photoId)

            if (error) throw error

            setPhotos((prev) => prev.filter((photo) => photo.id !== photoId))
            Alert.alert("Success", "Photo deleted successfully")
          } catch (error: any) {
            Alert.alert("Error", error.message)
          }
        },
      },
    ])
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchPhotos()
  }

  const addPhotoPlaceholder = () => {
    Alert.alert(
      "Add Photo",
      "Photo upload functionality would be implemented here. This would typically involve:\n\n• Image picker from camera/gallery\n• Image compression and optimization\n• Upload to storage service\n• Save URL to database",
      [{ text: "OK" }],
    )
  }

  const renderPhoto = (photo: RestaurantPhoto) => (
    <View key={photo.id} style={styles.photoContainer}>
      <Image source={{ uri: photo.photo_url }} style={styles.photo} />

      {photo.is_primary && (
        <View style={styles.primaryBadge}>
          <Ionicons name="star" size={12} color="#fff" />
          <Text style={styles.primaryText}>Primary</Text>
        </View>
      )}

      <View style={styles.photoActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => setPrimaryPhoto(photo.id)}
          disabled={photo.is_primary}
        >
          <Ionicons name="star" size={16} color={photo.is_primary ? "#ccc" : "#FF6B35"} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => deletePhoto(photo.id)}>
          <Ionicons name="trash" size={16} color="#F44336" />
        </TouchableOpacity>
      </View>

      {photo.caption && <Text style={styles.photoCaption}>{photo.caption}</Text>}
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading photos...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Photos</Text>
        <TouchableOpacity style={styles.addButton} onPress={addPhotoPlaceholder}>
          <Ionicons name="add" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{restaurant.name}</Text>
        <Text style={styles.photoCount}>
          {photos.length} photo{photos.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {photos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="camera-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Photos Yet</Text>
            <Text style={styles.emptySubtitle}>Add photos to showcase your restaurant and attract more customers!</Text>
            <TouchableOpacity style={styles.addPhotoButton} onPress={addPhotoPlaceholder}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.addPhotoButtonText}>Add First Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.photosGrid}>
              {photos.map(renderPhoto)}

              {/* Add photo placeholder */}
              <TouchableOpacity style={styles.addPhotoPlaceholder} onPress={addPhotoPlaceholder}>
                <Ionicons name="add" size={40} color="#ccc" />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Photo Tips</Text>
              <View style={styles.tipItem}>
                <Ionicons name="camera" size={16} color="#FF6B35" />
                <Text style={styles.tipText}>Use high-quality, well-lit photos</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="restaurant" size={16} color="#FF6B35" />
                <Text style={styles.tipText}>Show your best dishes and restaurant atmosphere</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="star" size={16} color="#FF6B35" />
                <Text style={styles.tipText}>Set a primary photo that represents your restaurant</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="people" size={16} color="#FF6B35" />
                <Text style={styles.tipText}>Photos help customers decide to visit your restaurant</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
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
  addButton: {
    padding: 5,
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
  photoCount: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 15,
    justifyContent: "space-between",
  },
  photoContainer: {
    width: photoWidth,
    marginBottom: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photo: {
    width: "100%",
    height: photoWidth,
    backgroundColor: "#f0f0f0",
  },
  primaryBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6B35",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  primaryText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 2,
  },
  photoActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#FFF3E0",
  },
  deleteButton: {
    backgroundColor: "#FFEBEE",
  },
  photoCaption: {
    fontSize: 12,
    color: "#666",
    padding: 8,
    paddingTop: 0,
  },
  addPhotoPlaceholder: {
    width: photoWidth,
    height: photoWidth,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  addPhotoText: {
    fontSize: 12,
    color: "#ccc",
    marginTop: 5,
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
  addPhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6B35",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  addPhotoButtonText: {
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
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    flex: 1,
  },
})
