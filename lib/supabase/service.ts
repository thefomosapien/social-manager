import { createClient } from '@supabase/supabase-js'
import { createPgClient } from './pg-client'

export function createServiceClient() {
  if (process.env.DATABASE_URL) return createPgClient()
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
