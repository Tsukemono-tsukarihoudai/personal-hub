import { createDb } from '../db'
import type { Env } from '../types'

const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })

const err = (message: string, status: number) => json({ error: message }, status)

// POST /outfits/:id/items  →  { item_id, position? }
export async function addOutfitItem(
    outfitId: string,
    request: Request,
    env: Env,
): Promise<Response> {
    let body: { item_id: string; position?: number }
    try { body = await request.json() as typeof body } catch { return err('Invalid JSON', 400) }

    if (!body.item_id) return err('item_id is required', 400)

    const { error } = await createDb(env)
        .from('outfit_items')
        .insert({ outfit_id: outfitId, item_id: body.item_id, position: body.position ?? null })

    if (error) return err(error.message, 400)
    return new Response(null, { status: 204 })
}

// DELETE /outfits/:id/items/:item_id
export async function removeOutfitItem(
    outfitId: string,
    itemId: string,
    env: Env,
): Promise<Response> {
    const { error } = await createDb(env)
        .from('outfit_items')
        .delete()
        .eq('outfit_id', outfitId)
        .eq('item_id', itemId)

    if (error) return err(error.message, 500)
    return new Response(null, { status: 204 })
}

// PUT /outfits/:id/items/reorder  →  { items: Array<{ item_id, position }> }
export async function reorderOutfitItems(
    outfitId: string,
    request: Request,
    env: Env,
): Promise<Response> {
    let body: { items: Array<{ item_id: string; position: number }> }
    try { body = await request.json() as typeof body } catch { return err('Invalid JSON', 400) }

    if (!Array.isArray(body.items)) return err('items must be an array', 400)

    const db = createDb(env)
    // 各アイテムの position を個別更新（upsert）
    const updates = body.items.map(({ item_id, position }) =>
        db
            .from('outfit_items')
            .update({ position })
            .eq('outfit_id', outfitId)
            .eq('item_id', item_id),
    )

    const results = await Promise.all(updates)
    const failed  = results.find(r => r.error)
    if (failed?.error) return err(failed.error.message, 500)

    return new Response(null, { status: 204 })
}
