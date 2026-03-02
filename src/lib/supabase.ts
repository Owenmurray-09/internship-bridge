import { createBrowserClient } from '@supabase/ssr'

export const createClientSupabase = () => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// For backward compatibility, but prefer createClientSupabase()
export const supabase = createClientSupabase()