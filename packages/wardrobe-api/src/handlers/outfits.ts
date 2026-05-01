import { createDb } from '../db'
import type { Env } from '../types'

const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })

const err = (message: string, status: number) => json({ error: message }, status)

// outfits に outfit_items → wardrobe_items をネストして取得し Outfit 型に変換
const OUTFIT_SELECT = `
    *,
    outfit_items (
        position,
        wardrobe_items (*)
    )
` as const

function transformOutfit(raw: any) {
    const { outfit_items, ...rest } = raw
    return {
        ...rest,
        items: (outfit_items as any[])
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            .map((oi: any) => oi.wardrobe_items),
    }
}

const TEMP_BUFFER = 3

// GET /outfits  (?temp=N で ± 3℃ フィルタ)
export async function listOutfits(request: Request, env: Env): Promise<Response> {
    const url  = new URL(request.url)
    const temp = url.searchParams.get('temp')

    let query = createDb(env).from('outfits').select(OUTFIT_SELECT)

    if (temp !== null) {
        const t = parseInt(temp, 10)
        if (isNaN(t)) return err('temp must be a number', 400)
        query = query
            .lte('temperature_min', t + TEMP_BUFFER)
            .gte('temperature_max', t - TEMP_BUFFER)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) return err(error.message, 500)
    return json((data as any[]).map(transformOutfit))
}

// GET /outfits/:id
export async function getOutfit(id: string, env: Env): Promise<Response> {
    const { data, error } = await createDb(env)
        .from('outfits')
        .select(OUTFIT_SELECT)
        .eq('id', id)
        .single()
    if (error) return err('Outfit not found', 404)
    return json(transformOutfit(data))
}

// POST /outfits
export async function createOutfit(request: Request, env: Env): Promise<Response> {
    let body: Record<string, unknown>
    try { body = await request.json() as Record<string, unknown> } catch { return err('Invalid JSON', 400) }

    const { data, error } = await createDb(env)
        .from('outfits')
        .insert(body)
        .select(OUTFIT_SELECT)
        .single()
    if (error) return err(error.message, 400)
    return json(transformOutfit(data), 201)
}

// PUT /outfits/:id
export async function updateOutfit(id: string, request: Request, env: Env): Promise<Response> {
    let body: Record<string, unknown>
    try { body = await request.json() as Record<string, unknown> } catch { return err('Invalid JSON', 400) }

    const { data, error } = await createDb(env)
        .from('outfits')
        .update(body)
        .eq('id', id)
        .select(OUTFIT_SELECT)
        .single()
    if (error) return err(error.message, 400)
    return json(transformOutfit(data))
}

// DELETE /outfits/:id
export async function deleteOutfit(id: string, env: Env): Promise<Response> {
    // outfit_items は ON DELETE CASCADE で自動削除
    const { error } = await createDb(env).from('outfits').delete().eq('id', id)
    if (error) return err(error.message, 500)
    return new Response(null, { status: 204 })
}
