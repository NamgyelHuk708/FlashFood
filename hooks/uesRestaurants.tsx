"use client"

// BUSINESS LAYER - Custom Hook for Restaurant State Management with proper type handling
import { useState, useEffect, useCallback } from "react"
import { RestaurantService, type Restaurant, type RestaurantFilters } from "../services/restaurantService"
import { RestaurantActions } from "../bussiness/RestaurantActions"

interface UseRestaurantsReturn {
  restaurants: Restaurant[]
  loading: boolean
  error: string | null
  filters: RestaurantFilters
  updateFilters: (newFilters: Partial<RestaurantFilters>) => void
  clearFilters: () => void
  sortRestaurants: (
    sortBy: "rating" | "distance" | "name",
    userLocation?: { latitude: number; longitude: number },
  ) => void
  refetch: () => Promise<void>
  hasActiveFilters: boolean
  filterSummary: string
}

export const useRestaurants = (initialFilters: RestaurantFilters = {}): UseRestaurantsReturn => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<RestaurantFilters>(initialFilters)

  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await RestaurantService.getAllRestaurants()
      setRestaurants(data)
    } catch (err: any) {
      setError(err.message || "Failed to fetch restaurants")
    } finally {
      setLoading(false)
    }
  }, [])

  const applyFilters = useCallback(() => {
    const filtered = RestaurantActions.filterRestaurants(restaurants, filters)
    setFilteredRestaurants(filtered)
  }, [restaurants, filters])

  const updateFilters = useCallback((newFilters: Partial<RestaurantFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const sortRestaurants = useCallback(
    (sortBy: "rating" | "distance" | "name", userLocation?: { latitude: number; longitude: number }) => {
      const sorted = RestaurantActions.sortRestaurants(filteredRestaurants, sortBy, userLocation)
      setFilteredRestaurants(sorted)
    },
    [filteredRestaurants],
  )

  // Computed values
  const hasActiveFilters = RestaurantActions.hasActiveFilters(filters)
  const filterSummary = RestaurantActions.getFilterSummary(filters)

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  return {
    restaurants: filteredRestaurants,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    sortRestaurants,
    refetch: fetchRestaurants,
    hasActiveFilters,
    filterSummary,
  }
}
