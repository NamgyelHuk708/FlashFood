export interface Profile {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
    user_type?: "customer" | "owner"
    created_at: string
    updated_at: string
  }
  
  export interface Restaurant {
    id: string
    name: string
    cuisine: string
    rating: number
    review_count: number
    address: string
    phone?: string
    hours?: string
    price_range: string
    description?: string
    features?: string[]
    images?: string[]
    latitude?: number
    longitude?: number
    owner_id?: string
    created_at: string
    updated_at: string
  }
  
  export interface Favorite {
    id: string
    user_id: string
    restaurant_id: string
    created_at: string
  }
  
  export interface Review {
    id: string
    user_id: string
    restaurant_id: string
    rating: number
    comment: string
    created_at: string
    profiles?: Profile
  }
  
  export interface Location {
    latitude: number
    longitude: number
  }
  