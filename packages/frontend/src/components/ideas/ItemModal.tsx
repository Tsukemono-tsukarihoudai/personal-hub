import { useState, useRef } from 'react'
import MDEditor from '@uiw/react-md-editor'
import { X } from 'lucide-react'
import { itemsApi } from '../../lib/api'
import type { Item, ItemClass, ItemStatus, KillCategory } from '../../types'
import { STATUS_ORDER } from '../../types'

interface Props {
    item:    Item | null   // null = 新規作成
    onClose: () => void
    onSaved: () => void
}

const CLASSES: ItemClass[]   = ['IDEA', 'UNDIVIDED_TASK', 'SUPER_TASK', 'TODO_TASK']
const KILL_CATS: KillCategory[] = ['TIME', 'COST', 'PASSION', 'TECH', 'OTHER']

export default function ItemModal({ item, onClose, onSaved }: Props) {
    const isNew = !item

    const [title,       setTitle]       = useState(item?.title ?? '')
    const [cls,         setCls]         = useState<ItemClass>(item?.class ?? 'IDEA')
    const [status,      setStatus]      = useState<ItemStatus>(item?.status ?? '0%')
    const [priority,    setPriority]    = useState(item?.priority ?? 3)
    const [startDate,   setStartDate]   = useState(item?.start_date ?? '')
    const [dueDate,     setDueDate]     = useState(item?.due_date ?? '')
    const [killCat,     setKillCat]     = useState<KillCategory | ''>(item?.kill_cat ?? '')
    const [description, setDescription] = useState<string | undefined>(item?.description ?? '')
    const [saving,      setSaving]      = useState(false)
    const [error,       setError]       = useState<string | null>(null)

    async function save() {
        if (!title.trim()) { setError('タイトルは必須です'); return }
        if (status === 'KILLED' && !killCat) { setError('KILLEDの場合はkill_catが必須です'); return }

        setSaving(true)
        setError(null)
        try {
            const body: Partial<Item> = {
                title,
                class:       cls,
                status,
                priority,
                start_date:  startDate || null,
                due_date:    dueDate   || null,
                kill_cat:    (status === 'KILLED' ? killCat : null) as KillCategory | null,
                description: description || null,
            }
            if (isNew) {
                await itemsApi.create(body)
            } else {
                await itemsApi.update(item!.id, body)
            }
            onSaved()
            onClose()
        } catch (e) {
            setError((e as Error).message)
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete() {
        if (!item) return
        if (!killCat) { setError('KILLEDの場合はkill_catが必須です'); return }
        setSaving(true)
        try {
            await itemsApi.kill(item.id, killCat)
            onSaved()
            onClose()
        } catch (e) {
            setError((e as Error).message)
        } finally {
            setSaving(false)
        }
    }

    // スワイプでステータス変更
    const touchStartX = useRef<number>(0)
    function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0]!.clientX }
    function onTouchEnd(e: React.TouchEvent) {
        const dx = e.changedTouches[0]!.clientX - touchStartX.current
        if (Math.abs(dx) < 50) return
        const idx = STATUS_ORDER.indexOf(status)
        if (dx > 0 && idx < STATUS_ORDER.length - 1) setStatus(STATUS_ORDER[idx + 1]!)
        if (dx < 0 && idx > 0) setStatus(STATUS_ORDER[idx - 1]!)
    }

    // レスポンシブ：PC=右パネル、iOS=センターオーバーレイ
    return (
        <div
            className="fixed inset-0 z-40 flex md:justify-end"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                className="
                    w-full md:w-[480px] h-full bg-background border-l
                    flex flex-col overflow-hidden shadow-xl
                    md:translate-x-0
                    /* モバイル：上から90%の高さのモーダル */
                    md:relative absolute bottom-0 max-h-[92vh] md:max-h-full rounded-t-2xl md:rounded-none
                "
            >
                {/* ヘッダー */}
                <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="タイトル"
                        className="flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-muted-foreground"
                    />
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X size={18} /></button>
                </div>

                {/* フォーム */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {error && <p className="text-sm text-red-500">{error}</p>}

                    {/* 基本属性 */}
                    <div className="flex flex-wrap gap-2">
                        <select value={cls} onChange={e => setCls(e.target.value as ItemClass)}
                            className="rounded-md border bg-background px-2 py-1 text-sm">
                            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select value={status} onChange={e => setStatus(e.target.value as ItemStatus)}
                            className="rounded-md border bg-background px-2 py-1 text-sm">
                            {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={priority} onChange={e => setPriority(Number(e.target.value))}
                            className="rounded-md border bg-background px-2 py-1 text-sm">
                            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                                <option key={n} value={n}>p{n}</option>
                            ))}
                        </select>
                    </div>

                    {/* 日付 */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs text-muted-foreground block mb-1">開始日</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                className="w-full rounded-md border bg-background px-2 py-1 text-sm" />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-muted-foreground block mb-1">期限</label>
                            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                                className="w-full rounded-md border bg-background px-2 py-1 text-sm" />
                        </div>
                    </div>

                    {/* kill_cat（KILLEDのときのみ） */}
                    {status === 'KILLED' && (
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">kill_cat</label>
                            <select value={killCat} onChange={e => setKillCat(e.target.value as KillCategory)}
                                className="rounded-md border bg-background px-2 py-1 text-sm">
                                <option value="">選択してください</option>
                                {KILL_CATS.map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Description (MD) */}
                    <div data-color-mode="light">
                        <label className="text-xs text-muted-foreground block mb-1">Description</label>
                        <MDEditor
                            value={description}
                            onChange={setDescription}
                            height={240}
                            preview="live"
                        />
                    </div>
                </div>

                {/* フッター */}
                <div className="px-4 py-3 border-t flex items-center gap-2 shrink-0">
                    {!isNew && (
                        <button
                            onClick={handleDelete}
                            disabled={saving}
                            className="px-3 py-1.5 rounded-md text-sm text-red-500 hover:bg-red-50"
                        >KILL</button>
                    )}
                    <div className="flex-1" />
                    <button onClick={onClose} className="px-4 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted">
                        キャンセル
                    </button>
                    <button
                        onClick={save}
                        disabled={saving}
                        className="px-4 py-1.5 rounded-md text-sm bg-primary text-primary-foreground disabled:opacity-50"
                    >
                        {saving ? '保存中…' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    )
}
