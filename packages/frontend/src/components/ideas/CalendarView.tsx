import { useState } from 'react'
import {
    startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    addDays, addMonths, format, isSameMonth, isSameDay,
    parseISO, differenceInDays, isWithinInterval,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Item } from '../../types'

interface Props {
    tasks:    Item[]
    onSelect: (item: Item) => void
}

export default function CalendarView({ tasks, onSelect }: Props) {
    const [month, setMonth] = useState(new Date())

    const monthStart = startOfMonth(month)
    const monthEnd   = endOfMonth(month)
    const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd     = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const days: Date[] = []
    for (let d = calStart; d <= calEnd; d = addDays(d, 1)) days.push(d)

    function getBar(item: Item, day: Date): { isStart: boolean; isEnd: boolean; isBar: boolean } | null {
        const start = item.start_date ? parseISO(item.start_date) : null
        const end   = item.due_date   ? parseISO(item.due_date)   : null

        if (!start && !end) return null
        if (start && end) {
            if (isWithinInterval(day, { start, end })) {
                return { isStart: isSameDay(day, start), isEnd: isSameDay(day, end), isBar: true }
            }
            return null
        }
        if (start && isSameDay(day, start)) return { isStart: true, isEnd: true, isBar: false }
        if (end   && isSameDay(day, end))   return { isStart: true, isEnd: true, isBar: false }
        return null
    }

    const activeTasks = tasks.filter(t => t.status !== 'KILLED')

    return (
        <div className="p-4">
            {/* ナビ */}
            <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setMonth(m => addMonths(m, -1))} className="p-1 hover:bg-muted rounded">
                    <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-medium">{format(month, 'yyyy年M月')}</span>
                <button onClick={() => setMonth(m => addMonths(m, 1))} className="p-1 hover:bg-muted rounded">
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* 曜日ヘッダー */}
            <div className="grid grid-cols-7 text-center text-xs text-muted-foreground mb-1">
                {['月','火','水','木','金','土','日'].map(d => (
                    <div key={d}>{d}</div>
                ))}
            </div>

            {/* カレンダーグリッド */}
            <div className="grid grid-cols-7 gap-px bg-border">
                {days.map((day, i) => {
                    const isToday      = isSameDay(day, new Date())
                    const isThisMonth  = isSameMonth(day, month)
                    const dayTasks     = activeTasks.map(t => ({ task: t, bar: getBar(t, day) })).filter(x => x.bar)

                    return (
                        <div
                            key={i}
                            className={`bg-background min-h-[80px] p-1 ${!isThisMonth ? 'opacity-30' : ''}`}
                        >
                            <div className={`text-xs w-5 h-5 flex items-center justify-center rounded-full mb-1 ${
                                isToday ? 'bg-foreground text-background font-bold' : 'text-muted-foreground'
                            }`}>
                                {format(day, 'd')}
                            </div>
                            <div className="space-y-0.5">
                                {dayTasks.map(({ task, bar }) => bar && (
                                    <button
                                        key={task.id}
                                        onClick={() => onSelect(task)}
                                        className={`w-full text-left text-[10px] px-1 py-0.5 rounded truncate
                                            ${bar.isBar ? 'bg-primary/20 text-foreground' : ''}
                                            ${!bar.isBar ? 'text-muted-foreground' : ''}
                                            ${bar.isStart ? 'rounded-l-full' : 'rounded-l-none'}
                                            ${bar.isEnd   ? 'rounded-r-full' : 'rounded-r-none'}`}
                                    >
                                        {(bar.isStart || !bar.isBar) ? task.title : ''}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
