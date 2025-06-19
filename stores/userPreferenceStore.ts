// PERSISTENCE LAYER - Zustand Store for User Preferences
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { StateCreator } from "zustand"

interface UserLocation {
  latitude: number
  longitude: number
}

type MapType = "standard" | "satellite" | "hybrid"
type Theme = "light" | "dark" | "system"

interface UserPreferencesState {
  // State
  locationPermissionGranted: boolean
  userLocation: UserLocation | null
  preferredCuisines: string[]
  mapType: MapType
  notificationsEnabled: boolean
  theme: Theme

  // Actions
  setLocationPermission: (granted: boolean) => void
  setUserLocation: (location: UserLocation | null) => void
  addPreferredCuisine: (cuisine: string) => void
  removePreferredCuisine: (cuisine: string) => void
  setMapType: (mapType: MapType) => void
  setNotificationsEnabled: (enabled: boolean) => void
  setTheme: (theme: Theme) => void
  resetPreferences: () => void
}

const userPreferencesStore: StateCreator<UserPreferencesState> = (set) => ({
  // Initial state
  locationPermissionGranted: false,
  userLocation: null,
  preferredCuisines: [],
  mapType: "standard" as MapType,
  notificationsEnabled: true,
  theme: "system" as Theme,

  // Actions with proper typing
  setLocationPermission: (granted: boolean) =>
    set({
      locationPermissionGranted: granted,
    }),

  setUserLocation: (location: UserLocation | null) =>
    set({
      userLocation: location,
    }),

  addPreferredCuisine: (cuisine: string) =>
    set((state: UserPreferencesState) => ({
      preferredCuisines: [...state.preferredCuisines, cuisine],
    })),

  removePreferredCuisine: (cuisine: string) =>
    set((state: UserPreferencesState) => ({
      preferredCuisines: state.preferredCuisines.filter((c) => c !== cuisine),
    })),

  setMapType: (mapType: MapType) => set({ mapType }),

  setNotificationsEnabled: (enabled: boolean) =>
    set({
      notificationsEnabled: enabled,
    }),

  setTheme: (theme: Theme) => set({ theme }),

  resetPreferences: () =>
    set({
      locationPermissionGranted: false,
      userLocation: null,
      preferredCuisines: [],
      mapType: "standard" as MapType,
      notificationsEnabled: true,
      theme: "system" as Theme,
    }),
})

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(userPreferencesStore, {
    name: "user-preferences-storage",
    storage: createJSONStorage(() => AsyncStorage),
  }),
)
