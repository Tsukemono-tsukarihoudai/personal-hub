import type { Env } from './types'

export function keyFromPublicUrl(env: Env, imageUrl: string): string {
    return imageUrl.replace(`${env.R2_PUBLIC_URL}/`, '')
}

export function imageKey(imageUrl: string, env: Env): string {
    return imageUrl.startsWith('http') ? keyFromPublicUrl(env, imageUrl) : imageUrl
}

export async function putObject(
    env: Env,
    key: string,
    body: ArrayBuffer,
    contentType: string,
): Promise<string> {
    await env.R2.put(key, body, { httpMetadata: { contentType } })
    return key
}

export async function deleteObject(env: Env, key: string): Promise<void> {
    await env.R2.delete(key)
}
