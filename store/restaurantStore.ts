import { create } from "zustand"
import { supabase } from "../lib/superbase"
import type { Restaurant, Location } from "../types"

interface RestaurantState {
  restaurants: Restaurant[]
  favorites: string[]
  loading: boolean
  userLocation: Location | null
  fetchNearbyRestaurants: (location: Location) => Promise<void>
  addToFavorites: (restaurantId: string) => Promise<void>
  removeFromFavorites: (restaurantId: string) => Promise<void>
  loadFavorites: () => Promise<void>
  setUserLocation: (location: Location) => void
}

export const useRestaurantStore = create<RestaurantState>((set, get) => ({
  restaurants: [],
  favorites: [],
  loading: false,
  userLocation: null,

  fetchNearbyRestaurants: async (location: Location) => {
    console.log("Fetching restaurants...")
    set({ loading: true })
    try {
      // For now, fetch all restaurants. In production, you'd implement geospatial queries
      const { data, error } = await supabase.from("restaurants").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching restaurants:", error)
        throw error
      }

      console.log("Fetched restaurants:", data?.length || 0)
      set({ restaurants: data || [] })
    } catch (error) {
      console.error("Error fetching restaurants:", error)
      set({ restaurants: [] })
    } finally {
      set({ loading: false })
    }
  },

  addToFavorites: async (restaurantId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      console.log("Adding to favorites:", restaurantId)
      const { error } = await supabase.from("favorites").insert({ user_id: user.id, restaurant_id: restaurantId })

      if (error) {
        console.error("Error adding to favorites:", error)
        throw error
      }

      const currentFavorites = get().favorites
      set({ favorites: [...currentFavorites, restaurantId] })
      console.log("Added to favorites successfully")
    } catch (error) {
      console.error("Error adding to favorites:", error)
      throw error
    }
  },

  removeFromFavorites: async (restaurantId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      console.log("Removing from favorites:", restaurantId)
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("restaurant_id", restaurantId)

      if (error) {
        console.error("Error removing from favorites:", error)
        throw error
      }

      const currentFavorites = get().favorites
      set({ favorites: currentFavorites.filter((id) => id !== restaurantId) })
      console.log("Removed from favorites successfully")
    } catch (error) {
      console.error("Error removing from favorites:", error)
      throw error
    }
  },

  loadFavorites: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        console.log("No user, skipping favorites load")
        return
      }

      console.log("Loading favorites...")
      const { data, error } = await supabase.from("favorites").select("restaurant_id").eq("user_id", user.id)

      if (error) {
        console.error("Error loading favorites:", error)
        throw error
      }

      const favoriteIds = data?.map((fav) => fav.restaurant_id) || []
      console.log("Loaded favorites:", favoriteIds.length)
      set({ favorites: favoriteIds })
    } catch (error) {
      console.error("Error loading favorites:", error)
      set({ favorites: [] })
    }
  },

  setUserLocation: (location: Location) => {
    console.log("Setting user location:", location)
    set({ userLocation: location })
  },
}))
