import { createDb } from '../db'
import type { Env, KillCategory } from '../types'

const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })

const err = (message: string, status: number) => json({ error: message }, status)

// GET /items
export async function listItems(request: Request, env: Env): Promise<Response> {
    const db  = createDb(env)
    const url = new URL(request.url)

    let query = db.from('items').select('*')

    const cls    = url.searchParams.get('class')
    const status = url.searchParams.get('status')
    if (cls)    query = query.eq('class', cls)
    if (status) query = query.eq('status', status)

    const { data, error } = await query.order('priority', { ascending: false })
    if (error) return err(error.message, 500)
    return json(data)
}

// GET /items/:id
export async function getItem(id: string, env: Env): Promise<Response> {
    const { data, error } = await createDb(env)
        .from('items')
        .select('*')
        .eq('id', id)
        .single()
    if (error) return err('Item not found', 404)
    return json(data)
}

// POST /items
export async function createItem(request: Request, env: Env): Promise<Response> {
    let body: Record<string, unknown>
    try { body = await request.json() as Record<string, unknown> } catch { return err('Invalid JSON', 400) }

    const { data, error } = await createDb(env)
        .from('items')
        .insert(body)
        .select()
        .single()
    if (error) return err(error.message, 400)
    return json(data, 201)
}

// PUT /items/:id
export async function updateItem(id: string, request: Request, env: Env): Promise<Response> {
    let body: Record<string, unknown>
    try { body = await request.json() as Record<string, unknown> } catch { return err('Invalid JSON', 400) }

    if (body['status'] === 'KILLED' && !body['kill_cat']) {
        return err('kill_cat is required when status is KILLED', 400)
    }

    const { data, error } = await createDb(env)
        .from('items')
        .update(body)
        .eq('id', id)
        .select()
        .single()
    if (error) return err(error.message, 400)
    return json(data)
}

// DELETE /items/:id  →  論理削除（status = KILLED）
export async function killItem(id: string, request: Request, env: Env): Promise<Response> {
    let body: { kill_cat?: KillCategory } = {}
    try { body = await request.json() as { kill_cat?: KillCategory } } catch { /* body省略可 */ }

    if (!body.kill_cat) {
        return err('kill_cat is required', 400)
    }

    const { data, error } = await createDb(env)
        .from('items')
        .update({ status: 'KILLED', kill_cat: body.kill_cat })
        .eq('id', id)
        .select()
        .single()
    if (error) return err(error.message, 400)
    return json(data)
}
