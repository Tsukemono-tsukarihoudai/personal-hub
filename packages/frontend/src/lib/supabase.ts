import { createClient } from '@supabase/supabase-js'

const url = import.meta.env['VITE_SUPABASE_URL'] as string
const key = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string

// JWT expiry はデフォルト（1時間）のままでよい。
// autoRefreshToken: true により refresh token でセッションが自動継続される。
export const supabase = createClient(url, key, {
    auth: {
        persistSession:     true,
        storageKey:         'personal-hub-auth',
        autoRefreshToken:   true,
        detectSessionInUrl: true,
        flowType:           'pkce',
    },
})
