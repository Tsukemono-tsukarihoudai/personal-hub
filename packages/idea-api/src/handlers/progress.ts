import { createDb } from '../db'
import type { Env } from '../types'

// GET /items/:id/progress
// 進捗 = DONE数 / KILLEDを除いた子item数
export async function getProgress(id: string, env: Env): Promise<Response> {
    const db = createDb(env)

    const { data: item, error: itemError } = await db
        .from('items')
        .select('class')
        .eq('id', id)
        .single()

    if (itemError) {
        return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404 })
    }
    if (item.class !== 'SUPER_TASK') {
        return new Response(JSON.stringify({ error: 'Item is not a SUPER_TASK' }), { status: 400 })
    }

    const { data: children, error } = await db
        .from('items')
        .select('status')
        .eq('parent_id', id)

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    const killed   = children.filter(c => c.status === 'KILLED').length
    const done     = children.filter(c => c.status === 'DONE').length
    const active   = children.length - killed          // KILLEDを除いた全件数
    const progress = active === 0 ? 0 : done / active  // 0除算ガード

    return new Response(
        JSON.stringify({ id, total: children.length, active, done, killed, progress }),
        { headers: { 'Content-Type': 'application/json' } },
    )
}
