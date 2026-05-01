import { createDb } from '../db'
import { putObject, deleteObject, keyFromPublicUrl } from '../r2'
import type { Env } from '../types'

const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })

const err = (message: string, status: number) => json({ error: message }, status)

// GET /wardrobe
export async function listWardrobe(request: Request, env: Env): Promise<Response> {
    const url      = new URL(request.url)
    const category = url.searchParams.get('category')
    const season   = url.searchParams.get('season')
    const tag      = url.searchParams.get('tag')

    let query = createDb(env).from('wardrobe_items').select('*')
    if (category) query = query.eq('category', category)
    if (season)   query = query.contains('seasons', [season])
    if (tag)      query = query.contains('tags', [tag])

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) return err(error.message, 500)
    return json(data)
}

// GET /wardrobe/:id
export async function getWardrobeItem(id: string, env: Env): Promise<Response> {
    const { data, error } = await createDb(env)
        .from('wardrobe_items')
        .select('*')
        .eq('id', id)
        .single()
    if (error) return err('Item not found', 404)
    return json(data)
}

// GET /wardrobe/:id/outfits  →  逆引き
export async function getRelatedOutfits(id: string, env: Env): Promise<Response> {
    const { data, error } = await createDb(env)
        .from('outfits')
        .select('*, outfit_items!inner(item_id)')
        .eq('outfit_items.item_id', id)
    if (error) return err(error.message, 500)
    return json(data)
}

// POST /wardrobe
// id をリクエストボディに含めると、フロント先行生成のUUIDを使用できる
// 省略時は Supabase の gen_random_uuid() に委ねる
export async function createWardrobeItem(request: Request, env: Env): Promise<Response> {
    let body: Record<string, unknown>
    try { body = await request.json() as Record<string, unknown> } catch { return err('Invalid JSON', 400) }

    const id = (body['id'] as string | undefined) ?? crypto.randomUUID()

    const { data, error } = await createDb(env)
        .from('wardrobe_items')
        .insert({ ...body, id })
        .select()
        .single()
    if (error) return err(error.message, 400)
    return json(data, 201)
}

// PUT /wardrobe/:id
export async function updateWardrobeItem(id: string, request: Request, env: Env): Promise<Response> {
    let body: Record<string, unknown>
    try { body = await request.json() as Record<string, unknown> } catch { return err('Invalid JSON', 400) }

    const { data, error } = await createDb(env)
        .from('wardrobe_items')
        .update(body)
        .eq('id', id)
        .select()
        .single()
    if (error) return err(error.message, 400)
    return json(data)
}

// DELETE /wardrobe/:id  →  R2画像削除 → DBレコード削除
export async function deleteWardrobeItem(id: string, env: Env): Promise<Response> {
    const db = createDb(env)

    const { data: item, error: fetchErr } = await db
        .from('wardrobe_items')
        .select('image_url')
        .eq('id', id)
        .single()
    if (fetchErr) return err('Item not found', 404)

    // R2画像削除（失敗したらDB削除もしない）
    if (item.image_url) {
        try {
            await deleteObject(env, keyFromPublicUrl(env, item.image_url))
        } catch (e) {
            return err(`R2 delete failed: ${(e as Error).message}`, 500)
        }
    }

    const { error } = await db.from('wardrobe_items').delete().eq('id', id)
    if (error) return err(error.message, 500)
    return new Response(null, { status: 204 })
}

// POST /wardrobe/:id/image  (multipart/form-data)
export async function uploadImage(id: string, request: Request, env: Env): Promise<Response> {
    const db = createDb(env)

    let formData: FormData
    try { formData = await request.formData() } catch { return err('Invalid form data', 400) }

    const file = formData.get('file') as File | string | null
    if (!file || typeof file === 'string') return err('file field is required', 400)

    const ext         = file.name.split('.').pop() ?? 'jpg'
    const key         = `wardrobe/${id}/${Date.now()}.${ext}`
    const buffer      = await file.arrayBuffer()

    let imageUrl: string
    try {
        imageUrl = await putObject(env, key, buffer, file.type || 'image/jpeg')
    } catch (e) {
        return err(`Upload failed: ${(e as Error).message}`, 500)
    }

    // 既存画像を削除
    const { data: existing } = await db
        .from('wardrobe_items')
        .select('image_url')
        .eq('id', id)
        .single()
    if (existing?.image_url) {
        await deleteObject(env, keyFromPublicUrl(env, existing.image_url)).catch(() => {})
    }

    const { error } = await db
        .from('wardrobe_items')
        .update({ image_url: imageUrl })
        .eq('id', id)
    if (error) return err(error.message, 500)

    return json({ image_url: imageUrl })
}

// DELETE /wardrobe/:id/image
export async function deleteImage(id: string, env: Env): Promise<Response> {
    const db = createDb(env)

    const { data: item, error: fetchErr } = await db
        .from('wardrobe_items')
        .select('image_url')
        .eq('id', id)
        .single()
    if (fetchErr) return err('Item not found', 404)
    if (!item.image_url) return err('No image to delete', 404)

    try {
        await deleteObject(env, keyFromPublicUrl(env, item.image_url))
    } catch (e) {
        return err(`R2 delete failed: ${(e as Error).message}`, 500)
    }

    const { error } = await db
        .from('wardrobe_items')
        .update({ image_url: null })
        .eq('id', id)
    if (error) return err(error.message, 500)

    return new Response(null, { status: 204 })
}
