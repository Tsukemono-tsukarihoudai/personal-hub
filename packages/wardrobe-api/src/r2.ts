import type { Env } from './types'

export function publicUrl(env: Env, key: string): string {
    return `${env.R2_PUBLIC_URL}/${key}`
}

export function keyFromPublicUrl(env: Env, imageUrl: string): string {
    return imageUrl.replace(`${env.R2_PUBLIC_URL}/`, '')
}

export async function putObject(
    env: Env,
    key: string,
    body: ArrayBuffer,
    contentType: string,
): Promise<string> {
    await env.R2.put(key, body, { httpMetadata: { contentType } })
    return publicUrl(env, key)
}

export async function deleteObject(env: Env, key: string): Promise<void> {
    await env.R2.delete(key)
}
