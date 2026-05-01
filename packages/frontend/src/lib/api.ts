import { supabase } from './supabase'
import type { Item, WardrobeItem, Outfit } from '../types'

const IDEA_API     = import.meta.env['VITE_IDEA_API_URL']     as string
const WARDROBE_API = import.meta.env['VITE_WARDROBE_API_URL'] as string

// ── 共通 ─────────────────────────────────────────────────────────────────────

async function authHeaders(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession()
    const jwt = data.session?.access_token
    if (!jwt) throw new Error('Not authenticated')
    return { Authorization: `Bearer ${jwt}` }
}

async function req<T>(
    baseUrl: string,
    path: string,
    init: RequestInit = {},
    isFormData = false,
): Promise<T> {
    const headers = isFormData
        ? await authHeaders()
        : { ...await authHeaders(), 'Content-Type': 'application/json' }

    const res = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: { ...headers, ...(init.headers ?? {}) },
    })

    if (res.status === 204) return undefined as T
    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error((body as any).error ?? 'Request failed')
    }
    return res.json()
}

const idea     = <T>(path: string, init?: RequestInit) => req<T>(IDEA_API,     path, init)
const wardrobe = <T>(path: string, init?: RequestInit, isForm?: boolean) => req<T>(WARDROBE_API, path, init, isForm)

// ── Items ─────────────────────────────────────────────────────────────────────

export const itemsApi = {
    list:     (params?: Record<string, string>) =>
        idea<Item[]>(`/items?${new URLSearchParams(params).toString()}`),
    get:      (id: string) =>
        idea<Item>(`/items/${id}`),
    create:   (body: Partial<Item>) =>
        idea<Item>('/items', { method: 'POST', body: JSON.stringify(body) }),
    update:   (id: string, body: Partial<Item>) =>
        idea<Item>(`/items/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    kill:     (id: string, kill_cat: string) =>
        idea<Item>(`/items/${id}`, { method: 'DELETE', body: JSON.stringify({ kill_cat }) }),
    progress: (id: string) =>
        idea<{ id: string; active: number; done: number; killed: number; progress: number }>(
            `/items/${id}/progress`,
        ),
}

// ── Wardrobe ──────────────────────────────────────────────────────────────────

export const wardrobeApi = {
    list:    (params?: Record<string, string>) =>
        wardrobe<WardrobeItem[]>(`/wardrobe?${new URLSearchParams(params).toString()}`),
    get:     (id: string) =>
        wardrobe<WardrobeItem>(`/wardrobe/${id}`),
    outfits: (id: string) =>
        wardrobe<Outfit[]>(`/wardrobe/${id}/outfits`),
    create:  (body: Partial<WardrobeItem>) =>
        wardrobe<WardrobeItem>('/wardrobe', { method: 'POST', body: JSON.stringify(body) }),
    update:  (id: string, body: Partial<WardrobeItem>) =>
        wardrobe<WardrobeItem>(`/wardrobe/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete:  (id: string) =>
        wardrobe<void>(`/wardrobe/${id}`, { method: 'DELETE' }),
    uploadImage: (id: string, file: File) => {
        const form = new FormData()
        form.append('file', file)
        return wardrobe<{ image_url: string }>(`/wardrobe/${id}/image`, { method: 'POST', body: form }, true)
    },
    deleteImage: (id: string) =>
        wardrobe<void>(`/wardrobe/${id}/image`, { method: 'DELETE' }),
}

// ── Outfits ───────────────────────────────────────────────────────────────────

export const outfitsApi = {
    list:   (params?: Record<string, string>) =>
        wardrobe<Outfit[]>(`/outfits?${new URLSearchParams(params).toString()}`),
    get:    (id: string) =>
        wardrobe<Outfit>(`/outfits/${id}`),
    create: (body: Partial<Outfit>) =>
        wardrobe<Outfit>('/outfits', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Outfit>) =>
        wardrobe<Outfit>(`/outfits/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) =>
        wardrobe<void>(`/outfits/${id}`, { method: 'DELETE' }),
    addItem:     (outfitId: string, item_id: string, position?: number) =>
        wardrobe<void>(`/outfits/${outfitId}/items`, { method: 'POST', body: JSON.stringify({ item_id, position }) }),
    removeItem:  (outfitId: string, itemId: string) =>
        wardrobe<void>(`/outfits/${outfitId}/items/${itemId}`, { method: 'DELETE' }),
    reorderItems: (outfitId: string, items: Array<{ item_id: string; position: number }>) =>
        wardrobe<void>(`/outfits/${outfitId}/items/reorder`, { method: 'PUT', body: JSON.stringify({ items }) }),
}
