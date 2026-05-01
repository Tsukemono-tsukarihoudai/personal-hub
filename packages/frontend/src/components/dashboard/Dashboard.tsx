import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useWeather } from '../../hooks/useWeather'
import { itemsApi, outfitsApi } from '../../lib/api'

export default function Dashboard() {
    const today        = format(new Date(), 'yyyy-MM-dd')
    const { weather }  = useWeather()

    const { data: todos } = useQuery({
        queryKey: ['items', 'todo', today],
        queryFn:  () => itemsApi.list({ class: 'TODO_TASK' }),
        select:   items => items.filter(i => i.due_date === today && i.status !== 'DONE' && i.status !== 'KILLED'),
    })

    const { data: ideas } = useQuery({
        queryKey: ['items', 'idea', today],
        queryFn:  () => itemsApi.list({ class: 'IDEA' }),
        select:   items => items.filter(i => i.last_fed_at?.startsWith(today)),
    })

    const { data: outfits } = useQuery({
        queryKey: ['outfits', 'temp', weather?.temperature],
        queryFn:  () => outfitsApi.list(
            weather ? { temp: String(Math.round(weather.temperature)) } : {},
        ),
        enabled: weather !== null,
    })

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-4xl">
            <h1 className="text-2xl font-bold">{format(new Date(), 'M月d日（E）', { locale: undefined })}</h1>

            {/* Today Widget */}
            <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="rounded-xl border p-4">
                    <p className="text-xs text-muted-foreground mb-1">現在気温</p>
                    <p className="text-3xl font-semibold">
                        {weather ? `${weather.temperature}℃` : '…'}
                    </p>
                </div>

                <div className="rounded-xl border p-4 col-span-1 md:col-span-2">
                    <p className="text-xs text-muted-foreground mb-2">今日のコーデ（気温 ± 3℃）</p>
                    <div className="flex gap-2 overflow-x-auto">
                        {outfits?.length === 0 && (
                            <p className="text-sm text-muted-foreground">該当なし</p>
                        )}
                        {outfits?.map(outfit => (
                            <div key={outfit.id} className="shrink-0 rounded-lg border p-3 text-xs w-28">
                                <p className="font-medium truncate">{outfit.name ?? '無題'}</p>
                                <p className="text-muted-foreground">
                                    {outfit.temperature_min}〜{outfit.temperature_max}℃
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* サマリー */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section>
                    <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">今日のTODO</h2>
                    {todos?.length === 0 && <p className="text-sm text-muted-foreground">なし</p>}
                    <ul className="space-y-2">
                        {todos?.map(item => (
                            <li key={item.id} className="flex items-center gap-2 text-sm">
                                <span className="shrink-0 rounded px-1.5 py-0.5 bg-muted text-xs">{item.status}</span>
                                <span className="truncate">{item.title}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">今日のIDEA</h2>
                    {ideas?.length === 0 && <p className="text-sm text-muted-foreground">なし</p>}
                    <ul className="space-y-2">
                        {ideas?.map(item => (
                            <li key={item.id} className="text-sm truncate">{item.title}</li>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    )
}
