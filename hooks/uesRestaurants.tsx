"use client"

// BUSINESS LAYER - Enhanced Restaurant Hook using Zustand
import { useEffect, useCallback } from "react"
import { Alert } from "react-native"
import { RestaurantService, type Restaurant, type RestaurantFilters } from "../services/restaurantService"
import { FavoriteService } from "../services/favouriteService"
import { RestaurantActions } from "../bussiness/RestaurantActions"
import { useRestaurantStore } from "../stores/restaurantStore"
import { useAuthStore } from "../stores/authStore"

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface UseRestaurantsReturn {
  restaurants: Restaurant[]
  allRestaurants: Restaurant[]
  favorites: string[]
  filters: RestaurantFilters
  loading: boolean
  error: string | null
  updateFilters: (newFilters: Partial<RestaurantFilters>) => void
  clearFilters: () => void
  toggleFavorite: (restaurantId: string) => Promise<void>
  sortRestaurants: (
    sortBy: "rating" | "distance" | "name",
    userLocation?: { latitude: number; longitude: number },
  ) => void
  refetch: (forceRefresh?: boolean) => Promise<void>
  clearCache: () => void
  hasActiveFilters: boolean
  filterSummary: string
}

export const useRestaurantsWithZustand = (): UseRestaurantsReturn => {
  const {
    restaurants,
    filteredRestaurants,
    favorites,
    filters,
    loading,
    error,
    lastFetch,
    setRestaurants,
    setFilteredRestaurants,
    setFavorites,
    updateFilters,
    clearFilters,
    setLoading,
    setError,
    addToFavorites,
    removeFromFavorites,
    updateRestaurant,
    clearCache,
  } = useRestaurantStore()

  const { user } = useAuthStore()

  // Check if cache is still valid
  const isCacheValid = useCallback((): boolean => {
    if (!lastFetch) return false
    return Date.now() - lastFetch < CACHE_DURATION
  }, [lastFetch])

  // Fetch restaurants with caching
  const fetchRestaurants = useCallback(
    async (forceRefresh = false): Promise<void> => {
      if (!forceRefresh && isCacheValid() && restaurants.length > 0) {
        return // Use cached data
      }

      try {
        setLoading(true)
        setError(null)
        const data = await RestaurantService.getAllRestaurants()
        setRestaurants(data)
      } catch (err: any) {
        setError(err.message || "Failed to fetch restaurants")
        Alert.alert("Error", err.message)
      } finally {
        setLoading(false)
      }
    },
    [isCacheValid, restaurants.length, setLoading, setError, setRestaurants],
  )

  // Fetch user favorites
  const fetchFavorites = useCallback(async (): Promise<void> => {
    if (!user) return

    try {
      const userFavorites = await FavoriteService.getUserFavorites(user.id)
      setFavorites(userFavorites)
    } catch (err: any) {
      console.error("Error fetching favorites:", err.message)
    }
  }, [user, setFavorites])

  // Apply filters to restaurants
  const applyFilters = useCallback((): void => {
    const filtered = RestaurantActions.filterRestaurants(restaurants, filters)
    setFilteredRestaurants(filtered)
  }, [restaurants, filters, setFilteredRestaurants])

  // Toggle favorite status
  const toggleFavorite = useCallback(
    async (restaurantId: string): Promise<void> => {
      if (!user) return

      try {
        const isFavorite = favorites.includes(restaurantId)

        if (isFavorite) {
          await FavoriteService.removeFromFavorites(user.id, restaurantId)
          removeFromFavorites(restaurantId)
        } else {
          await FavoriteService.addToFavorites(user.id, restaurantId)
          addToFavorites(restaurantId)
        }
      } catch (err: any) {
        Alert.alert("Error", err.message)
      }
    },
    [user, favorites, addToFavorites, removeFromFavorites],
  )

  // Sort restaurants
  const sortRestaurants = useCallback(
    (sortBy: "rating" | "distance" | "name", userLocation?: { latitude: number; longitude: number }): void => {
      const sorted = RestaurantActions.sortRestaurants(filteredRestaurants, sortBy, userLocation)
      setFilteredRestaurants(sorted)
    },
    [filteredRestaurants, setFilteredRestaurants],
  )

  // Update filters
  const handleUpdateFilters = useCallback(
    (newFilters: Partial<RestaurantFilters>): void => {
      updateFilters(newFilters)
    },
    [updateFilters],
  )

  // Clear all filters
  const handleClearFilters = useCallback((): void => {
    clearFilters()
  }, [clearFilters])

  // Initial data fetch
  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  // Fetch favorites when user changes
  useEffect(() => {
    if (user) {
      fetchFavorites()
    } else {
      setFavorites([])
    }
  }, [user, fetchFavorites, setFavorites])

  // Apply filters when restaurants or filters change
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  return {
    restaurants: filteredRestaurants,
    allRestaurants: restaurants,
    favorites,
    filters,
    loading,
    error,
    updateFilters: handleUpdateFilters,
    clearFilters: handleClearFilters,
    toggleFavorite,
    sortRestaurants,
    refetch: fetchRestaurants,
    clearCache,
    hasActiveFilters: RestaurantActions.hasActiveFilters(filters),
    filterSummary: RestaurantActions.getFilterSummary(filters),
  }
}
