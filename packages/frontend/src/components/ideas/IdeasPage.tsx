import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { itemsApi } from '../../lib/api'
import WeeklyView from './WeeklyView'
import CalendarView from './CalendarView'
import ListView from './ListView'
import ItemModal from './ItemModal'
import type { Item } from '../../types'

type ViewMode = 'weekly' | 'calendar' | 'list'

export default function IdeasPage() {
    const [view, setView]               = useState<ViewMode>('weekly')
    const [selectedItem, setSelectedItem] = useState<Item | null>(null)
    const [creating, setCreating]       = useState(false)
    const qc = useQueryClient()

    const { data: ideas } = useQuery({
        queryKey: ['items', 'IDEA'],
        queryFn:  () => itemsApi.list({ class: 'IDEA' }),
    })

    const { data: tasks } = useQuery({
        queryKey: ['items', 'TODO_TASK'],
        queryFn:  () => itemsApi.list({ class: 'TODO_TASK' }),
    })

    function refresh() {
        qc.invalidateQueries({ queryKey: ['items'] })
    }

    return (
        <div className="flex h-full overflow-hidden">
            {/* IDEA サイドバー */}
            <aside className="w-56 shrink-0 border-r p-3 flex flex-col gap-2 overflow-y-auto hidden md:flex">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">IDEA</span>
                    <button
                        onClick={() => setCreating(true)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                    >＋</button>
                </div>
                {ideas?.filter(i => i.status !== 'DONE' && i.status !== 'KILLED').map(idea => (
                    <button
                        key={idea.id}
                        onClick={() => setSelectedItem(idea)}
                        className="text-left text-sm px-2 py-1.5 rounded-md hover:bg-muted truncate"
                    >
                        {idea.title}
                    </button>
                ))}
            </aside>

            {/* メインエリア */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* ビュー切り替え */}
                <div className="flex gap-1 p-3 border-b shrink-0">
                    {(['weekly', 'calendar', 'list'] as ViewMode[]).map(v => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`px-3 py-1 rounded-md text-sm transition-colors
                                ${view === v ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {v === 'weekly' ? 'ウィークリー' : v === 'calendar' ? 'カレンダー' : 'リスト'}
                        </button>
                    ))}
                </div>

                {/* ビュー本体 */}
                <div className="flex-1 overflow-auto">
                    {view === 'weekly' && (
                        <WeeklyView
                            tasks={tasks ?? []}
                            ideas={ideas ?? []}
                            onSelect={setSelectedItem}
                            onPromoted={refresh}
                        />
                    )}
                    {view === 'calendar' && (
                        <CalendarView tasks={tasks ?? []} onSelect={setSelectedItem} />
                    )}
                    {view === 'list' && (
                        <ListView onSelect={setSelectedItem} />
                    )}
                </div>
            </div>

            {/* 編集モーダル */}
            {(selectedItem || creating) && (
                <ItemModal
                    item={creating ? null : selectedItem}
                    onClose={() => { setSelectedItem(null); setCreating(false) }}
                    onSaved={refresh}
                />
            )}
        </div>
    )
}
