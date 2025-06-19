// PRESENTATION LAYER - Reusable UI Component
import { memo } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface RestaurantCardProps {
  restaurant: {
    id: string
    name: string
    cuisine_type: string
    address: string
    rating: number
    image_url: string
  }
  isFavorite?: boolean
  onPress: () => void
  onFavoritePress?: () => void
  showDistance?: boolean
  distance?: number
}

const RestaurantCard = memo(
  ({
    restaurant,
    isFavorite = false,
    onPress,
    onFavoritePress,
    showDistance = false,
    distance,
  }: RestaurantCardProps) => {
    const renderStars = (rating: number) => {
      const stars = []
      for (let i = 1; i <= 5; i++) {
        stars.push(<Ionicons key={i} name={i <= rating ? "star" : "star-outline"} size={16} color="#FFD700" />)
      }
      return stars
    }

    return (
      <TouchableOpacity style={styles.card} onPress={onPress}>
        <Image source={{ uri: restaurant.image_url || "https://via.placeholder.com/150" }} style={styles.image} />

        {onFavoritePress && (
          <TouchableOpacity style={styles.favoriteButton} onPress={onFavoritePress}>
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color={isFavorite ? "#FF6B35" : "#fff"} />
          </TouchableOpacity>
        )}

        <View style={styles.content}>
          <Text style={styles.name}>{restaurant.name}</Text>
          <Text style={styles.cuisine}>{restaurant.cuisine_type}</Text>
          <Text style={styles.address} numberOfLines={1}>
            {restaurant.address}
          </Text>

          <View style={styles.footer}>
            <View style={styles.rating}>
              {renderStars(restaurant.rating)}
              <Text style={styles.ratingText}>({restaurant.rating})</Text>
            </View>

            {showDistance && distance !== undefined && <Text style={styles.distance}>{distance.toFixed(1)} km</Text>}
          </View>
        </View>
      </TouchableOpacity>
    )
  },
)

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
  content: {
    padding: 15,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  cuisine: {
    fontSize: 14,
    color: "#FF6B35",
    marginBottom: 5,
  },
  address: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#666",
  },
  distance: {
    fontSize: 12,
    color: "#999",
  },
})

export default RestaurantCard
