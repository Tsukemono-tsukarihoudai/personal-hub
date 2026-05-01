import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { itemsApi } from '../../lib/api'
import type { Item, ItemClass, ItemStatus } from '../../types'
import { STATUS_ORDER } from '../../types'

interface Props {
    onSelect: (item: Item) => void
}

const CLASSES: ItemClass[]  = ['IDEA', 'UNDIVIDED_TASK', 'SUPER_TASK', 'TODO_TASK']

export default function ListView({ onSelect }: Props) {
    const [filterClass,  setFilterClass]  = useState<ItemClass | ''>('')
    const [filterStatus, setFilterStatus] = useState<ItemStatus | ''>('')

    const { data: items, isLoading } = useQuery({
        queryKey: ['items', 'all'],
        queryFn:  () => itemsApi.list(),
    })

    const filtered = (items ?? [])
        .filter(i => !filterClass  || i.class  === filterClass)
        .filter(i => !filterStatus || i.status === filterStatus)
        .sort((a, b) => b.priority - a.priority)

    return (
        <div className="p-4 space-y-4">
            {/* フィルタ */}
            <div className="flex flex-wrap gap-2">
                <select
                    value={filterClass}
                    onChange={e => setFilterClass(e.target.value as ItemClass | '')}
                    className="rounded-md border bg-background px-2 py-1 text-sm"
                >
                    <option value="">すべての class</option>
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value as ItemStatus | '')}
                    className="rounded-md border bg-background px-2 py-1 text-sm"
                >
                    <option value="">すべての status</option>
                    {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {isLoading && <p className="text-sm text-muted-foreground">読み込み中…</p>}

            <div className="space-y-1">
                {filtered.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onSelect(item)}
                        className="w-full text-left rounded-md px-3 py-2 hover:bg-muted flex items-center gap-3 text-sm"
                    >
                        <span className="shrink-0 rounded px-1.5 py-0.5 bg-muted text-xs text-muted-foreground">{item.class}</span>
                        <span className="shrink-0 rounded px-1.5 py-0.5 bg-muted text-xs text-muted-foreground">{item.status}</span>
                        <span className="truncate font-medium">{item.title}</span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">p{item.priority}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
