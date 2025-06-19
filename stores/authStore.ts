// PERSISTENCE LAYER - Zustand Store for Authentication State
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { StateCreator } from "zustand"
import type { Session, User } from "@supabase/supabase-js"

interface AuthState {
  // State
  session: Session | null
  user: User | null
  loading: boolean

  // Actions
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
}

const authStore: StateCreator<AuthState> = (set) => ({
  // Initial state
  session: null,
  user: null,
  loading: true,

  // Actions with proper typing
  setSession: (session: Session | null) =>
    set({
      session,
      user: session?.user || null,
    }),

  setLoading: (loading: boolean) => set({ loading }),

  clearAuth: () =>
    set({
      session: null,
      user: null,
      loading: false,
    }),
})

export const useAuthStore = create<AuthState>()(
  persist(authStore, {
    name: "auth-storage",
    storage: createJSONStorage(() => AsyncStorage),
    // Only persist essential auth data
    partialize: (state: AuthState) => ({
      session: state.session,
      user: state.user,
    }),
  }),
)
