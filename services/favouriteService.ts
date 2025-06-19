// SERVICE LAYER - Favorites operations
import { supabase } from "../lib/supabase"

export class FavoriteService {
  static async getUserFavorites(userId: string): Promise<string[]> {
    const { data, error } = await supabase.from("favorites").select("restaurant_id").eq("user_id", userId)

    if (error) throw error
    return data?.map((fav) => fav.restaurant_id) || []
  }

  static async addToFavorites(userId: string, restaurantId: string): Promise<void> {
    const { error } = await supabase.from("favorites").insert([{ user_id: userId, restaurant_id: restaurantId }])

    if (error) throw error
  }

  static async removeFromFavorites(userId: string, restaurantId: string): Promise<void> {
    const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("restaurant_id", restaurantId)

    if (error) throw error
  }

  static async getFavoriteRestaurants(userId: string) {
    const { data, error } = await supabase
      .from("favorites")
      .select(`
        restaurant_id,
        restaurants (
          id,
          name,
          cuisine_type,
          address,
          rating,
          image_url,
          latitude,
          longitude
        )
      `)
      .eq("user_id", userId)

    if (error) throw error
    return data?.map((fav) => fav.restaurants).filter(Boolean) || []
  }
}
