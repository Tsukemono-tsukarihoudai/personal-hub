import { createClient } from '@supabase/supabase-js'
import type { Env } from './types'

export async function verifyJwt(request: Request, env: Env): Promise<boolean> {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return false

    const jwt = authHeader.slice(7)
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
    const { data, error } = await supabase.auth.getUser(jwt)
    return !error && !!data.user
}
