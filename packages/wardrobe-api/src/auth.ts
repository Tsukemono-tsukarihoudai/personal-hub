import { createClient } from '@supabase/supabase-js'
import type { Env } from './types'

const json = (body: object, status: number) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

export async function verifyJwt(request: Request, env: Env): Promise<Response | null> {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

    const jwt = authHeader.slice(7)
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
    const { data, error } = await supabase.auth.getUser(jwt)
    if (error || !data.user) return json({ error: 'Unauthorized' }, 401)

    if (env.ALLOWED_EMAIL && data.user.email !== env.ALLOWED_EMAIL)
        return json({ error: 'Forbidden' }, 403)

    return null
}
