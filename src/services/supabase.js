import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()

const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

console.log("URL =", supabaseUrl)
console.log("KEY =", supabaseKey?.substring(0,20))


if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase config belum terbaca'
  )
}


export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)