import { verifyJwt } from './auth'
import { listItems, getItem, createItem, updateItem, killItem } from './handlers/items'
import { getProgress } from './handlers/progress'
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

        // Preflight
        if (method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: CORS_HEADERS })
        }

        // Auth
        const authenticated = await verifyJwt(request, env)
        if (!authenticated) {
            return withCors(
                new Response(JSON.stringify({ error: 'Unauthorized' }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                }),
            )
        }

        // Routing
        const url            = new URL(request.url)
        const path           = url.pathname
        const progressMatch  = path.match(/^\/items\/([^/]+)\/progress$/)
        const itemMatch      = path.match(/^\/items\/([^/]+)$/)

        let response: Response

        if (path === '/items' && method === 'GET') {
            response = await listItems(request, env)
        } else if (path === '/items' && method === 'POST') {
            response = await createItem(request, env)
        } else if (progressMatch && method === 'GET') {
            response = await getProgress(progressMatch[1]!, env)
        } else if (itemMatch && method === 'GET') {
            response = await getItem(itemMatch[1]!, env)
        } else if (itemMatch && method === 'PUT') {
            response = await updateItem(itemMatch[1]!, request, env)
        } else if (itemMatch && method === 'DELETE') {
            response = await killItem(itemMatch[1]!, request, env)
        } else {
            response = new Response(JSON.stringify({ error: 'Not Found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        return withCors(response)
    },
}
