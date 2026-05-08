import { Client } from '@notionhq/client'
import type {
    PageObjectResponse,
    BlockObjectResponse,
} from '@notionhq/client/build/src/api-endpoints'
import { appendFileSync, readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'

// ── Env ──────────────────────────────────────────────────────────────────────

const NOTION_TOKEN       = process.env.NOTION_TOKEN!
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID!
const WARDROBE_API_URL   = process.env.WARDROBE_API_URL!
const SUPABASE_JWT       = process.env.SUPABASE_JWT!

const DONE_LOG = fileURLToPath(new URL('../migrate-wardrobe-done.log', import.meta.url))

// ── Notion category mapping ───────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = {
    pants: 'bottoms', bottoms: 'bottoms', denim: 'bottoms',
    chino: 'bottoms', slacks: 'bottoms', trousers: 'bottoms', skirt: 'bottoms',
    shirt: 'tops', tee: 'tops', sweat: 'tops', knit: 'tops', top: 'tops',
    coat: 'outer', jacket: 'outer', outer: 'outer', blouson: 'outer',
    shoes: 'shoes', sneaker: 'shoes', boot: 'shoes',
    bag: 'bag',
    accessory: 'accessory', muffler: 'accessory', hat: 'accessory', cap: 'accessory',
}

function mapCategory(value: string | null): string {
    if (!value) return 'other'
    return CATEGORY_MAP[value.toLowerCase()] ?? 'other'
}

const SEASON_MAP: Record<string, string> = {
    '春': 'spring', '夏': 'summer', '秋': 'autumn', '冬': 'winter',
}

// ── Property helpers ──────────────────────────────────────────────────────────

function propTitle(page: PageObjectResponse, key: string): string {
    const p = page.properties[key]
    if (!p || p.type !== 'title') return ''
    return p.title.map((t) => t.plain_text).join('')
}

function propSelect(page: PageObjectResponse, key: string): string | null {
    const p = page.properties[key]
    if (!p || p.type !== 'select') return null
    return p.select?.name ?? null
}

function propMultiSelect(page: PageObjectResponse, key: string): string[] {
    const p = page.properties[key]
    if (!p || p.type !== 'multi_select') return []
    return p.multi_select.map((s) => s.name)
}

function propText(page: PageObjectResponse, key: string): string {
    const p = page.properties[key]
    if (!p) return ''
    if (p.type === 'rich_text') return p.rich_text.map((t) => t.plain_text).join('')
    return ''
}

// ── Wardrobe API helpers ──────────────────────────────────────────────────────

const authHeaders = {
    Authorization: `Bearer ${SUPABASE_JWT}`,
    'Content-Type': 'application/json',
}

async function createItem(id: string, body: object): Promise<void> {
    const res = await fetch(`${WARDROBE_API_URL}/wardrobe`, {
        method:  'POST',
        headers: authHeaders,
        body:    JSON.stringify({ id, ...body }),
    })
    if (!res.ok) throw new Error(`POST /wardrobe ${res.status}: ${await res.text()}`)
}

async function uploadImage(id: string, imageUrl: string): Promise<void> {
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) throw new Error(`fetch image ${imgRes.status}`)
    const blob    = await imgRes.blob()
    const form    = new FormData()
    const ext     = imageUrl.split('?')[0]?.split('.').pop() ?? 'jpg'
    form.append('file', blob, `image.${ext}`)
    const res = await fetch(`${WARDROBE_API_URL}/wardrobe/${id}/image`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${SUPABASE_JWT}` },
        body:    form,
    })
    if (!res.ok) throw new Error(`POST /wardrobe/${id}/image ${res.status}: ${await res.text()}`)
}

// ── Notion image block ────────────────────────────────────────────────────────

async function getFirstImageUrl(notion: Client, pageId: string): Promise<string | null> {
    const blocks = await notion.blocks.children.list({ block_id: pageId })
    for (const block of blocks.results as BlockObjectResponse[]) {
        if (block.type === 'image') {
            const img = block.image
            return img.type === 'file' ? img.file.url : img.external.url
        }
    }
    return null
}

// ── Done log ──────────────────────────────────────────────────────────────────

function loadDone(): Set<string> {
    if (!existsSync(DONE_LOG)) return new Set()
    return new Set(readFileSync(DONE_LOG, 'utf-8').split('\n').filter(Boolean))
}

function markDone(notionId: string): void {
    appendFileSync(DONE_LOG, notionId + '\n')
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

async function resolveDatabaseId(notion: Client, id: string): Promise<string> {
    try {
        await notion.databases.retrieve({ database_id: id })
        return id
    } catch {
        // IDがページの場合、子ブロックから child_database を探す
        const blocks = await notion.blocks.children.list({ block_id: id })
        for (const block of blocks.results as BlockObjectResponse[]) {
            if (block.type === 'child_database') return block.id
        }
        throw new Error(`No child_database found in page ${id}`)
    }
}

async function main() {
    const notion = new Client({ auth: NOTION_TOKEN })
    const done   = loadDone()

    const dbId = await resolveDatabaseId(notion, NOTION_DATABASE_ID)
    if (dbId !== NOTION_DATABASE_ID) console.log(`Resolved database ID: ${dbId}`)

    let cursor: string | undefined
    let total = 0, skipped = 0, success = 0, failed = 0

    console.log('Fetching Notion database...')

    do {
        const res = await notion.databases.query({
            database_id: dbId,
            start_cursor: cursor,
        })

        for (const page of res.results as PageObjectResponse[]) {
            total++

            if (done.has(page.id)) {
                skipped++
                console.log(`  SKIP  ${page.id}`)
                continue
            }

            const id       = crypto.randomUUID()
            const name     = propTitle(page, '名前')
            const category = mapCategory(propSelect(page, 'ジャンル'))
            const tags     = propMultiSelect(page, 'テイスト')
            const seasons  = propMultiSelect(page, '季節').map((s) => SEASON_MAP[s] ?? s)
            const rawColor = propText(page, 'カラー')
            const colors   = rawColor
                ? rawColor.split(/[,、\s]+/).map((c) => c.trim()).filter(Boolean)
                : []

            try {
                await createItem(id, { name, category, tags, seasons, colors })
                await sleep(350)

                const imgUrl = await getFirstImageUrl(notion, page.id)
                await sleep(350)

                if (imgUrl) {
                    try {
                        await uploadImage(id, imgUrl)
                    } catch (e) {
                        console.warn(`  WARN  image upload failed for ${id}: ${e}`)
                    }
                    await sleep(350)
                }

                markDone(page.id)
                success++
                console.log(`  OK    ${name || '(no name)'}  →  ${id}`)
            } catch (e) {
                failed++
                console.error(`  FAIL  ${name || page.id}: ${e}`)
            }
        }

        cursor = res.next_cursor ?? undefined
    } while (cursor)

    console.log(`\nDone. total=${total} skip=${skipped} ok=${success} fail=${failed}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
