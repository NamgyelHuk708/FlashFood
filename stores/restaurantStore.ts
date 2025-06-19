// PERSISTENCE LAYER - Zustand Store for Restaurant State Management
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { StateCreator } from "zustand"
import type { Restaurant, RestaurantFilters } from "../services/restaurantService"

interface RestaurantState {
  // State
  restaurants: Restaurant[]
  filteredRestaurants: Restaurant[]
  favorites: string[]
  filters: RestaurantFilters
  loading: boolean
  error: string | null
  lastFetch: number | null

  // Actions
  setRestaurants: (restaurants: Restaurant[]) => void
  setFilteredRestaurants: (restaurants: Restaurant[]) => void
  setFavorites: (favorites: string[]) => void
  updateFilters: (filters: Partial<RestaurantFilters>) => void
  clearFilters: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addToFavorites: (restaurantId: string) => void
  removeFromFavorites: (restaurantId: string) => void
  updateRestaurant: (restaurant: Restaurant) => void
  clearCache: () => void
}

const restaurantStore: StateCreator<RestaurantState> = (set, get) => ({
  // Initial state
  restaurants: [],
  filteredRestaurants: [],
  favorites: [],
  filters: {},
  loading: false,
  error: null,
  lastFetch: null,

  // Actions with proper typing
  setRestaurants: (restaurants: Restaurant[]) =>
    set({
      restaurants,
      lastFetch: Date.now(),
    }),

  setFilteredRestaurants: (filteredRestaurants: Restaurant[]) =>
    set({
      filteredRestaurants,
    }),

  setFavorites: (favorites: string[]) => set({ favorites }),

  updateFilters: (newFilters: Partial<RestaurantFilters>) =>
    set((state: RestaurantState) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  clearFilters: () => set({ filters: {} }),

  setLoading: (loading: boolean) => set({ loading }),

  setError: (error: string | null) => set({ error }),

  addToFavorites: (restaurantId: string) =>
    set((state: RestaurantState) => ({
      favorites: [...state.favorites, restaurantId],
    })),

  removeFromFavorites: (restaurantId: string) =>
    set((state: RestaurantState) => ({
      favorites: state.favorites.filter((id) => id !== restaurantId),
    })),

  updateRestaurant: (updatedRestaurant: Restaurant) =>
    set((state: RestaurantState) => ({
      restaurants: state.restaurants.map((restaurant) =>
        restaurant.id === updatedRestaurant.id ? updatedRestaurant : restaurant,
      ),
      filteredRestaurants: state.filteredRestaurants.map((restaurant) =>
        restaurant.id === updatedRestaurant.id ? updatedRestaurant : restaurant,
      ),
    })),

  clearCache: () =>
    set({
      restaurants: [],
      filteredRestaurants: [],
      lastFetch: null,
    }),
})

export const useRestaurantStore = create<RestaurantState>()(
  persist(restaurantStore, {
    name: "restaurant-storage",
    storage: createJSONStorage(() => AsyncStorage),
    // Persist everything except loading and error states
    partialize: (state: RestaurantState) => ({
      restaurants: state.restaurants,
      favorites: state.favorites,
      filters: state.filters,
      lastFetch: state.lastFetch,
    }),
  }),
)
