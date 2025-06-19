// BUSINESS LAYER - Business logic and state management
import type { Restaurant, RestaurantFilters } from "../services/restaurantService"
import { FavoriteService } from "../services/favouriteService"

export class RestaurantActions {
  // Business logic for restaurant filtering with proper type guards
  static filterRestaurants(restaurants: Restaurant[], filters: RestaurantFilters): Restaurant[] {
    let filtered = restaurants

    // Filter by cuisine type
    if (filters.cuisine && filters.cuisine !== "All") {
      filtered = filtered.filter((restaurant) => restaurant.cuisine_type === filters.cuisine)
    }

    // Filter by minimum rating - Fixed with proper type guard
    if (filters.minRating !== undefined && filters.minRating > 0) {
      filtered = filtered.filter((restaurant) => restaurant.rating >= filters.minRating!)
    }

    // Filter by search query
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (restaurant) =>
          restaurant.name.toLowerCase().includes(query) ||
          restaurant.cuisine_type.toLowerCase().includes(query) ||
          restaurant.address.toLowerCase().includes(query),
      )
    }

    return filtered
  }

  // Business logic for distance calculation
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Business logic for sorting restaurants
  static sortRestaurants(
    restaurants: Restaurant[],
    sortBy: "rating" | "distance" | "name",
    userLocation?: { latitude: number; longitude: number },
  ): Restaurant[] {
    return [...restaurants].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating
        case "name":
          return a.name.localeCompare(b.name)
        case "distance":
          if (!userLocation) return 0
          const distanceA = this.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            a.latitude,
            a.longitude,
          )
          const distanceB = this.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            b.latitude,
            b.longitude,
          )
          return distanceA - distanceB
        default:
          return 0
      }
    })
  }

  // Business logic for restaurant validation
  static validateRestaurantData(data: Partial<Restaurant>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.name?.trim()) {
      errors.push("Restaurant name is required")
    }

    if (!data.cuisine_type) {
      errors.push("Cuisine type is required")
    }

    if (!data.address?.trim()) {
      errors.push("Address is required")
    }

    if (!data.phone?.trim()) {
      errors.push("Phone number is required")
    }

    if (data.email && !this.isValidEmail(data.email)) {
      errors.push("Invalid email format")
    }

    if (data.website && !this.isValidUrl(data.website)) {
      errors.push("Invalid website URL")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // Helper method to check if filters have meaningful values
  static hasActiveFilters(filters: RestaurantFilters): boolean {
    return !!(
      (filters.cuisine && filters.cuisine !== "All") ||
      (filters.minRating !== undefined && filters.minRating > 0) ||
      (filters.searchQuery && filters.searchQuery.trim())
    )
  }

  // Helper method to get filter summary
  static getFilterSummary(filters: RestaurantFilters): string {
    const parts: string[] = []

    if (filters.cuisine && filters.cuisine !== "All") {
      parts.push(filters.cuisine)
    }

    if (filters.minRating !== undefined && filters.minRating > 0) {
      parts.push(`${filters.minRating}+ stars`)
    }

    if (filters.searchQuery && filters.searchQuery.trim()) {
      parts.push(`"${filters.searchQuery.trim()}"`)
    }

    return parts.length > 0 ? parts.join(", ") : "No filters"
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
}

export class FavoriteActions {
  static async toggleFavorite(userId: string, restaurantId: string, currentFavorites: string[]): Promise<string[]> {
    const isFavorite = currentFavorites.includes(restaurantId)

    if (isFavorite) {
      await FavoriteService.removeFromFavorites(userId, restaurantId)
      return currentFavorites.filter((id) => id !== restaurantId)
    } else {
      await FavoriteService.addToFavorites(userId, restaurantId)
      return [...currentFavorites, restaurantId]
    }
  }
}
