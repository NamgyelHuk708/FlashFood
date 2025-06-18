import { create } from "zustand"
import { supabase } from "../lib/superbase"
import type { Profile } from "../types"

interface AuthState {
  user: any
  profile: Profile | null
  loading: boolean
  initialized: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, userType: "customer" | "owner") => Promise<void>
  signOut: () => Promise<void>
  loadProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  initialized: false,

  signIn: async (email: string, password: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      console.log("Sign in successful:", data.user?.id)
      // Don't set user here - let the auth state change handler do it
    } catch (error) {
      console.error(" Sign in error:", error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signUp: async (email: string, password: string, fullName: string, userType: "customer" | "owner") => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType,
          },
        },
      })

      if (error) {
        console.error("Supabase auth error:", error)
        throw new Error(error.message)
      }

      if (data.user && !data.user.email_confirmed_at) {
        console.log(" Sign up successful, but email needs confirmation:", data.user.id)
        return
      }

      console.log("Sign up successful:", data.user?.id)
    } catch (error: any) {
      console.error("Sign up error:", error)
      throw new Error(error.message || "Failed to create account")
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      console.log(" Sign out successful")
    } catch (error) {
      console.error("Sign out error:", error)
      throw error
    }
  },

  loadProfile: async () => {
    const state = get()
    if (!state.user) {
      console.log(" No user to load profile for")
      return
    }

    console.log("Loading profile for user:", state.user.id)

    try {
      const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", state.user.id).single()

      if (error) {
        if (error.code === "PGRST116") {
          // Profile doesn't exist, create it
          console.log("🔨 Creating profile...")
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: state.user.id,
              email: state.user.email || "",
              full_name: state.user.user_metadata?.full_name || "User",
              user_type: state.user.user_metadata?.user_type || "customer",
              avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(state.user.user_metadata?.full_name || "User")}&background=FF6B35&color=fff`,
            })
            .select()
            .single()

          if (insertError) {
            console.error(" Profile creation failed:", insertError)
          } else {
            console.log(" Profile created:", newProfile)
            set({ profile: newProfile })
          }
        } else {
          console.error(" Profile loading error:", error)
        }
      } else {
        console.log(" Profile loaded:", profile)
        set({ profile })
      }
    } catch (error) {
      console.error(" Profile loading failed:", error)
    }
  },
}))
