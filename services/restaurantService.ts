// SERVICE LAYER - Database operations and external API calls
import { supabase } from "../lib/supabase"

export interface Restaurant {
  id: string
  name: string
  cuisine_type: string
  address: string
  latitude: number
  longitude: number
  rating: number
  image_url: string
  phone?: string
  email?: string
  website?: string
  description?: string
  price_range?: string
  status?: string
  owner_verified?: boolean
}

export interface RestaurantFilters {
  cuisine?: string
  minRating?: number
  searchQuery?: string
}

export class RestaurantService {
  static async getAllRestaurants(): Promise<Restaurant[]> {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("status", "active")
      .order("rating", { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getRestaurantById(id: string): Promise<Restaurant | null> {
    const { data, error } = await supabase.from("restaurants").select("*").eq("id", id).single()

    if (error) throw error
    return data
  }

  static async searchRestaurants(filters: RestaurantFilters): Promise<Restaurant[]> {
    let query = supabase.from("restaurants").select("*").eq("status", "active")

    if (filters.cuisine && filters.cuisine !== "All") {
      query = query.eq("cuisine_type", filters.cuisine)
    }

    // Fixed: Added proper null check for minRating
    if (filters.minRating !== undefined && filters.minRating > 0) {
      query = query.gte("rating", filters.minRating)
    }

    if (filters.searchQuery && filters.searchQuery.trim()) {
      query = query.or(
        `name.ilike.%${filters.searchQuery}%,cuisine_type.ilike.%${filters.searchQuery}%,address.ilike.%${filters.searchQuery}%`,
      )
    }

    const { data, error } = await query.order("rating", { ascending: false })

    if (error) throw error
    return data || []
  }

  static async createRestaurant(restaurantData: Partial<Restaurant>): Promise<Restaurant> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    const { data, error } = await supabase
      .from("restaurants")
      .insert([
        {
          ...restaurantData,
          created_by: user.id,
          status: "active",
          owner_verified: true,
          rating: 0,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateRestaurant(id: string, updates: Partial<Restaurant>): Promise<void> {
    const { error } = await supabase
      .from("restaurants")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) throw error
  }
}
