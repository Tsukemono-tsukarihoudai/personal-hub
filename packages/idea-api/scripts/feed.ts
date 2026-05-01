import { createClient } from '@supabase/supabase-js'

// ── 環境変数 ──────────────────────────────────────────────────────────────────
const SUPABASE_URL       = process.env['SUPABASE_URL']!
const SUPABASE_SERVICE_KEY = process.env['SUPABASE_SERVICE_KEY']!
const SLACK_WEBHOOK_URL  = process.env['SLACK_WEBHOOK_URL']!
const W_p     = parseFloat(process.env['W_p']     ?? '2.0')
const W_t     = parseFloat(process.env['W_t']     ?? '0.5')
const W_t_max = parseFloat(process.env['W_t_max'] ?? '5.0')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── スコア計算 ────────────────────────────────────────────────────────────────
function elapsedDays(lastFedAt: string | null): number {
    if (!lastFedAt) return 0
    return (Date.now() - new Date(lastFedAt).getTime()) / (1000 * 60 * 60 * 24)
}

function calcScore(priority: number, lastFedAt: string | null): number {
    return priority * W_p + Math.min(elapsedDays(lastFedAt) * W_t, W_t_max)
}

// ── Slackメッセージ組み立て ────────────────────────────────────────────────────
function buildMessage(todos: any[], ideas: any[]): string {
    const lines: string[] = ['*Today\'s Feed*']

    if (ideas.length > 0) {
        lines.push('\n*IDEA*')
        for (const idea of ideas) {
            lines.push(`• *${idea.title}* (priority: ${idea.priority})`)
            if (idea.description) lines.push(`  ${idea.description}`)
        }
    }

    if (todos.length > 0) {
        lines.push('\n*TODO*')
        for (const todo of todos) {
            lines.push(`• ${todo.title} [${todo.status}]`)
        }
    }

    if (ideas.length === 0 && todos.length === 0) {
        lines.push('Nothing to feed today.')
    }

    return lines.join('\n')
}

// ── メイン ────────────────────────────────────────────────────────────────────
async function run() {
    // 1. TODO_TASK 一覧取得（DONE・KILLED以外・優先度降順）
    const { data: todos, error: todoErr } = await supabase
        .from('items')
        .select('*')
        .eq('class', 'TODO_TASK')
        .not('status', 'in', '("DONE","KILLED")')
        .order('priority', { ascending: false })

    if (todoErr) throw new Error(`TODO fetch failed: ${todoErr.message}`)

    // 2. IDEA 一覧取得（DONE・KILLED以外）
    const { data: ideas, error: ideaErr } = await supabase
        .from('items')
        .select('*')
        .eq('class', 'IDEA')
        .not('status', 'in', '("DONE","KILLED")')

    if (ideaErr) throw new Error(`IDEA fetch failed: ${ideaErr.message}`)

    // 3. スコア降順でソート → 上位1〜2件を抽選
    const picks = (ideas ?? [])
        .map(item => ({ item, score: calcScore(item.priority, item.last_fed_at) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map(s => s.item)

    // 4. last_fed_at 更新
    if (picks.length > 0) {
        const { error: updErr } = await supabase
            .from('items')
            .update({ last_fed_at: new Date().toISOString() })
            .in('id', picks.map(p => p.id))
        if (updErr) throw new Error(`Update failed: ${updErr.message}`)
    }

    // 5. Slack 送信
    const res = await fetch(SLACK_WEBHOOK_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text: buildMessage(todos ?? [], picks) }),
    })
    if (!res.ok) throw new Error(`Slack webhook failed: ${res.status}`)

    console.log(`Feed done: ${picks.length} idea(s), ${(todos ?? []).length} todo(s)`)
}

run().catch(err => {
    console.error(err)
    process.exit(1)
})
