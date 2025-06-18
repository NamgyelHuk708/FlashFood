import { supabase } from "../lib/superbase"
import type { Restaurant } from "../types"

export class RestaurantService {
  static async createRestaurant(restaurant: Omit<Restaurant, "id" | "created_at" | "updated_at">): Promise<Restaurant> {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    const restaurantData = {
      ...restaurant,
      owner_id: user.id,
    }

    const { data, error } = await supabase.from("restaurants").insert(restaurantData).select().single()

    if (error) throw error
    return data
  }

  static async getRestaurantById(id: string): Promise<Restaurant | null> {
    const { data, error } = await supabase.from("restaurants").select("*").eq("id", id).single()

    if (error) throw error
    return data
  }

  static async updateRestaurant(id: string, updates: Partial<Restaurant>): Promise<Restaurant> {
    const { data, error } = await supabase
      .from("restaurants")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteRestaurant(id: string): Promise<void> {
    const { error } = await supabase.from("restaurants").delete().eq("id", id)

    if (error) throw error
  }
}
