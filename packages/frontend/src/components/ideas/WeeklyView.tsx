import { useState } from 'react'
import { startOfWeek, addDays, addWeeks, format, isSameDay, parseISO } from 'date-fns'
import { DndContext, DragEndEvent, DragOverlay, useDroppable, useDraggable } from '@dnd-kit/core'
import { itemsApi } from '../../lib/api'
import type { Item, ItemStatus } from '../../types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const STATUS_RANK: Record<ItemStatus, number> = {
    '0%': 0, '20%': 1, '50%': 2, '80%': 3, 'DONE': 4, 'KILLED': 5,
}

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日']

interface Props {
    tasks:      Item[]
    ideas:      Item[]
    onSelect:   (item: Item) => void
    onPromoted: () => void
}

function TaskCard({ item, onSelect, isDragging = false }: { item: Item; onSelect: (item: Item) => void; isDragging?: boolean }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: item.id, data: { item } })
    const style = transform ? { transform: `translate(${transform.x}px,${transform.y}px)` } : undefined

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={() => onSelect(item)}
            className={`rounded-md border px-2 py-1.5 text-xs cursor-pointer hover:bg-muted select-none
                ${isDragging ? 'opacity-50' : ''}`}
        >
            <div className="flex items-center gap-1 mb-0.5">
                <span className="rounded px-1 bg-muted text-muted-foreground">{item.status}</span>
                <span className="text-muted-foreground">p{item.priority}</span>
            </div>
            <p className="truncate font-medium">{item.title}</p>
        </div>
    )
}

function IdeaCard({ item }: { item: Item }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: `idea-${item.id}`, data: { item, isIdea: true } })
    const style = transform ? { transform: `translate(${transform.x}px,${transform.y}px)` } : undefined
    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="rounded-md border border-dashed px-2 py-1.5 text-xs cursor-grab text-muted-foreground select-none"
        >
            {item.title}
        </div>
    )
}

function DayColumn({ date, tasks, onSelect }: { date: Date | null; tasks: Item[]; onSelect: (item: Item) => void }) {
    const id = date ? format(date, 'yyyy-MM-dd') : 'no-date'
    const { setNodeRef, isOver } = useDroppable({ id })
    const sorted = [...tasks].sort((a, b) => STATUS_RANK[a.status]! - STATUS_RANK[b.status]!)

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col gap-1 min-h-[120px] rounded-md p-1.5 transition-colors
                ${isOver ? 'bg-muted/60' : ''}`}
        >
            {sorted.map(task => (
                <TaskCard key={task.id} item={task} onSelect={onSelect} />
            ))}
        </div>
    )
}

export default function WeeklyView({ tasks, ideas, onSelect, onPromoted }: Props) {
    const [weekOffset, setWeekOffset] = useState(0)
    const [draggedIdea, setDraggedIdea] = useState<Item | null>(null)
    const [promoteDueDate, setPromoteDueDate] = useState<string | null>(null)
    const [promoteItem, setPromoteItem]     = useState<Item | null>(null)

    const weekStart = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset)
    const days      = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    // TODO_TASKを曜日別に振り分け
    const activeTasks = tasks.filter(t => t.status !== 'KILLED')
    function tasksForDay(date: Date) {
        return activeTasks.filter(t => t.due_date && isSameDay(parseISO(t.due_date), date))
    }
    const undated = activeTasks.filter(t => !t.due_date)

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        const data = active.data.current as { item: Item; isIdea?: boolean } | undefined
        if (!data) return

        if (data.isIdea && over) {
            // IDEAをドロップ → 昇格ミニモーダル
            setPromoteItem(data.item)
            setPromoteDueDate(over.id === 'no-date' ? '' : String(over.id))
        }
        setDraggedIdea(null)
    }

    async function confirmPromote() {
        if (!promoteItem) return
        await itemsApi.update(promoteItem.id, {
            class:    'TODO_TASK',
            due_date: promoteDueDate || null,
        })
        setPromoteItem(null)
        setPromoteDueDate(null)
        onPromoted()
    }

    return (
        <div className="p-4 h-full flex flex-col gap-4">
            {/* ナビ */}
            <div className="flex items-center gap-2">
                <button onClick={() => setWeekOffset(w => w - 1)} className="p-1 hover:bg-muted rounded">
                    <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-medium">
                    {format(weekStart, 'M/d')}〜{format(days[6]!, 'M/d')}
                </span>
                <button onClick={() => setWeekOffset(w => w + 1)} className="p-1 hover:bg-muted rounded">
                    <ChevronRight size={16} />
                </button>
                <button onClick={() => setWeekOffset(0)} className="ml-2 text-xs text-muted-foreground hover:text-foreground">今週</button>
            </div>

            <DndContext
                onDragStart={e => {
                    const data = e.active.data.current as any
                    if (data?.isIdea) setDraggedIdea(data.item)
                }}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-8 gap-2 text-xs flex-1 overflow-x-auto">
                    {/* ヘッダー */}
                    {WEEKDAYS.map((day, i) => (
                        <div key={day} className="text-center font-medium text-muted-foreground pb-1 border-b">
                            <div>{day}</div>
                            <div className={`text-xs ${isSameDay(days[i]!, new Date()) ? 'text-foreground font-bold' : ''}`}>
                                {format(days[i]!, 'd')}
                            </div>
                        </div>
                    ))}
                    <div className="text-center font-medium text-muted-foreground pb-1 border-b">日付なし</div>

                    {/* タスク列 */}
                    {days.map((date, i) => (
                        <DayColumn key={i} date={date} tasks={tasksForDay(date)} onSelect={onSelect} />
                    ))}
                    <DayColumn date={null} tasks={undated} onSelect={onSelect} />
                </div>

                {/* IDEAドラッグオーバーレイ（モバイル用ゴースト） */}
                <DragOverlay>
                    {draggedIdea && (
                        <div className="rounded-md border border-dashed px-2 py-1.5 text-xs bg-background shadow-lg opacity-90">
                            {draggedIdea.title}
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            {/* IDEAリスト（モバイル表示用・md以上では非表示） */}
            <div className="md:hidden">
                <p className="text-xs text-muted-foreground mb-2">IDEA（ドラッグしてタスクに昇格）</p>
                <div className="flex gap-2 flex-wrap">
                    {ideas.filter(i => i.status !== 'DONE' && i.status !== 'KILLED').map(idea => (
                        <IdeaCard key={idea.id} item={idea} />
                    ))}
                </div>
            </div>

            {/* 昇格確認ミニモーダル */}
            {promoteItem && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-background rounded-xl border p-6 w-80 space-y-4 shadow-xl">
                        <h3 className="font-semibold">IDEAをタスクに昇格</h3>
                        <p className="text-sm text-muted-foreground">{promoteItem.title}</p>
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">due_date（任意）</label>
                            <input
                                type="date"
                                value={promoteDueDate ?? ''}
                                onChange={e => setPromoteDueDate(e.target.value)}
                                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => { setPromoteItem(null); setPromoteDueDate(null) }}
                                className="px-4 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted"
                            >キャンセル</button>
                            <button
                                onClick={confirmPromote}
                                className="px-4 py-1.5 rounded-md text-sm bg-primary text-primary-foreground"
                            >昇格</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
