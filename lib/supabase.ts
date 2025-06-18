import { AppState } from "react-native"
import "react-native-url-polyfill/auto"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://utpiomtyucohpgehsafy.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cGlvbXR5dWNvaHBnZWhzYWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjk0NjIsImV4cCI6MjA2NTg0NTQ2Mn0.U3XMLAzKi59rogwGpvXUB3fr7zcOYJ6lRXp83ZqKtSU"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})
