"use client"

// BUSINESS LAYER - Enhanced Auth Hook using Zustand
import { useEffect } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"
import { useAuthStore } from "../stores/authStore"

interface UseAuthReturn {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

export const useAuthWithZustand = (): UseAuthReturn => {
  const { session, user, loading, setSession, setLoading, clearAuth } = useAuthStore()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [setSession, setLoading])

  const signOut = async (): Promise<void> => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      clearAuth()
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setLoading(false)
    }
  }

  return {
    session,
    user,
    loading,
    signOut,
    isAuthenticated: !!session?.user,
  }
}
