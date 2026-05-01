import { verifyJwt } from './auth'
import {
    listWardrobe, getWardrobeItem, getRelatedOutfits,
    createWardrobeItem, updateWardrobeItem, deleteWardrobeItem,
    uploadImage, deleteImage,
} from './handlers/wardrobe'
import {
    listOutfits, getOutfit, createOutfit, updateOutfit, deleteOutfit,
} from './handlers/outfits'
import {
    addOutfitItem, removeOutfitItem, reorderOutfitItems,
} from './handlers/outfit_items'
import type { Env } from './types'

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

function withCors(response: Response): Response {
    const headers = new Headers(response.headers)
    for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v)
    return new Response(response.body, { status: response.status, headers })
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const method = request.method

        if (method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: CORS_HEADERS })
        }

        const authenticated = await verifyJwt(request, env)
        if (!authenticated) {
            return withCors(new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } },
            ))
        }

        const path = new URL(request.url).pathname
        let response: Response

        // ── /wardrobe ────────────────────────────────────────────────────────
        if (path === '/wardrobe' && method === 'GET') {
            response = await listWardrobe(request, env)

        } else if (path === '/wardrobe' && method === 'POST') {
            response = await createWardrobeItem(request, env)

        } else {
            const wardrobeOutfits = path.match(/^\/wardrobe\/([^/]+)\/outfits$/)
            const wardrobeImage   = path.match(/^\/wardrobe\/([^/]+)\/image$/)
            const wardrobeItem    = path.match(/^\/wardrobe\/([^/]+)$/)

            if (wardrobeOutfits && method === 'GET') {
                response = await getRelatedOutfits(wardrobeOutfits[1]!, env)

            } else if (wardrobeImage && method === 'POST') {
                response = await uploadImage(wardrobeImage[1]!, request, env)

            } else if (wardrobeImage && method === 'DELETE') {
                response = await deleteImage(wardrobeImage[1]!, env)

            } else if (wardrobeItem && method === 'GET') {
                response = await getWardrobeItem(wardrobeItem[1]!, env)

            } else if (wardrobeItem && method === 'PUT') {
                response = await updateWardrobeItem(wardrobeItem[1]!, request, env)

            } else if (wardrobeItem && method === 'DELETE') {
                response = await deleteWardrobeItem(wardrobeItem[1]!, env)

            // ── /outfits ──────────────────────────────────────────────────────
            } else if (path === '/outfits' && method === 'GET') {
                response = await listOutfits(request, env)

            } else if (path === '/outfits' && method === 'POST') {
                response = await createOutfit(request, env)

            } else {
                // reorder より先に /outfits/:id/items/reorder を評価
                const outfitReorder  = path.match(/^\/outfits\/([^/]+)\/items\/reorder$/)
                const outfitItemDel  = path.match(/^\/outfits\/([^/]+)\/items\/([^/]+)$/)
                const outfitItems    = path.match(/^\/outfits\/([^/]+)\/items$/)
                const outfitItem     = path.match(/^\/outfits\/([^/]+)$/)

                if (outfitReorder && method === 'PUT') {
                    response = await reorderOutfitItems(outfitReorder[1]!, request, env)

                } else if (outfitItemDel && method === 'DELETE') {
                    response = await removeOutfitItem(outfitItemDel[1]!, outfitItemDel[2]!, env)

                } else if (outfitItems && method === 'POST') {
                    response = await addOutfitItem(outfitItems[1]!, request, env)

                } else if (outfitItem && method === 'GET') {
                    response = await getOutfit(outfitItem[1]!, env)

                } else if (outfitItem && method === 'PUT') {
                    response = await updateOutfit(outfitItem[1]!, request, env)

                } else if (outfitItem && method === 'DELETE') {
                    response = await deleteOutfit(outfitItem[1]!, env)

                } else {
                    response = new Response(
                        JSON.stringify({ error: 'Not Found' }),
                        { status: 404, headers: { 'Content-Type': 'application/json' } },
                    )
                }
            }
        }

        return withCors(response)
    },
}
