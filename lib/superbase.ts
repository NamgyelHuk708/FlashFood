import "react-native-url-polyfill/auto"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://fqmklusweqnblsmrlaka.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxbWtsdXN3ZXFuYmxzbXJsYWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNTAzMTYsImV4cCI6MjA2MjYyNjMxNn0.s28GWwseQSn7CdBo8IXex7H4-LJ-x0Lp1-pzENzmDzo"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
