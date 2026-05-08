import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import { outfitsApi, wardrobeApi } from '../../lib/api'
import { useWeather } from '../../hooks/useWeather'
import type { Outfit, OutfitOccasion, WardrobeItem } from '../../types'
import { WardrobeImage } from '../WardrobeImage'

const OCCASIONS: OutfitOccasion[] = ['casual', 'office', 'formal', 'sport', 'outdoor', 'other']

// ─── カード ───────────────────────────────────────────────────────────────────
function OutfitCard({ outfit, onClick }: { outfit: Outfit; onClick: () => void }) {
    return (
        <button onClick={onClick} className="rounded-xl border overflow-hidden text-left hover:shadow-md transition-shadow">
            <div className="flex flex-wrap gap-0.5 p-1.5 bg-muted min-h-[80px]">
                {outfit.items.slice(0, 4).map(item => (
                    item.image_url
                        ? <WardrobeImage key={item.id} itemId={item.id} alt={item.name}
                                className="w-10 h-10 rounded object-cover" />
                        : <div key={item.id} className="w-10 h-10 rounded bg-background flex items-center justify-center text-[10px] text-muted-foreground">
                            {item.category}
                          </div>
                ))}
            </div>
            <div className="p-2">
                <p className="text-sm font-medium truncate">{outfit.name ?? '無題'}</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                    {outfit.tags.map(t => (
                        <span key={t} className="text-[10px] bg-muted px-1.5 rounded">{t}</span>
                    ))}
                </div>
                {(outfit.temperature_min !== null && outfit.temperature_max !== null) && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                        {outfit.temperature_min}〜{outfit.temperature_max}℃
                    </p>
                )}
            </div>
        </button>
    )
}

// ─── 詳細パネル ───────────────────────────────────────────────────────────────
function OutfitPanel({ outfit, onClose, onSaved }: { outfit: Outfit; onClose: () => void; onSaved: () => void }) {
    const [name,     setName]     = useState(outfit.name ?? '')
    const [occasion, setOccasion] = useState<OutfitOccasion | ''>(outfit.occasion ?? '')
    const [tempMin,  setTempMin]  = useState(outfit.temperature_min ?? '')
    const [tempMax,  setTempMax]  = useState(outfit.temperature_max ?? '')
    const [notes,    setNotes]    = useState(outfit.notes ?? '')
    const [saving,   setSaving]   = useState(false)
    const [showItemSearch, setShowItemSearch] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const { data: allWardrobe } = useQuery({
        queryKey: ['wardrobe'],
        queryFn:  () => wardrobeApi.list(),
        enabled:  showItemSearch,
    })

    async function save() {
        setSaving(true)
        await outfitsApi.update(outfit.id, {
            name: name || null,
            occasion: (occasion || null) as OutfitOccasion | null,
            temperature_min: tempMin !== '' ? Number(tempMin) : null,
            temperature_max: tempMax !== '' ? Number(tempMax) : null,
            notes: notes || null,
        })
        onSaved()
        setSaving(false)
    }

    async function addItem(item: WardrobeItem) {
        await outfitsApi.addItem(outfit.id, item.id, outfit.items.length)
        onSaved()
        setShowItemSearch(false)
    }

    async function removeItem(itemId: string) {
        await outfitsApi.removeItem(outfit.id, itemId)
        onSaved()
    }

    async function handleDelete() {
        if (!confirm('このコーデを削除しますか？')) return
        await outfitsApi.delete(outfit.id)
        onSaved()
        onClose()
    }

    const filteredWardrobe = allWardrobe?.filter(w =>
        !outfit.items.some(i => i.id === w.id) &&
        (searchQuery === '' || w.name.includes(searchQuery) || w.tags.some(t => t.includes(searchQuery))),
    )

    return (
        <div className="fixed inset-0 z-40 flex md:justify-end" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="w-full md:w-[440px] h-full bg-background border-l flex flex-col overflow-hidden shadow-xl md:relative absolute bottom-0 max-h-[92vh] md:max-h-full rounded-t-2xl md:rounded-none">
                <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="コーデ名"
                        className="flex-1 bg-transparent font-semibold outline-none placeholder:text-muted-foreground" />
                    <button onClick={onClose}><X size={18} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* メタ情報 */}
                    <div className="flex gap-2 flex-wrap">
                        <select value={occasion} onChange={e => setOccasion(e.target.value as OutfitOccasion | '')}
                            className="rounded-md border bg-background px-2 py-1 text-sm">
                            <option value="">occasion</option>
                            {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">気温</span>
                        <input type="number" value={tempMin} onChange={e => setTempMin(e.target.value)}
                            placeholder="min" className="w-16 rounded-md border bg-background px-2 py-1 text-sm text-center" />
                        <span className="text-muted-foreground">〜</span>
                        <input type="number" value={tempMax} onChange={e => setTempMax(e.target.value)}
                            placeholder="max" className="w-16 rounded-md border bg-background px-2 py-1 text-sm text-center" />
                        <span className="text-muted-foreground">℃</span>
                    </div>

                    {/* 構成アイテム */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground">構成アイテム</span>
                            <button onClick={() => setShowItemSearch(true)}
                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                                <Plus size={14} /> 追加
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {outfit.items.map(item => (
                                <div key={item.id} className="relative">
                                    {item.image_url
                                        ? <WardrobeImage itemId={item.id} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                                        : <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">{item.category}</div>
                                    }
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-foreground text-background flex items-center justify-center text-[10px]"
                                    >×</button>
                                    <p className="text-[10px] text-center mt-0.5 truncate w-16">{item.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* アイテム検索 */}
                    {showItemSearch && (
                        <div className="rounded-xl border p-3 space-y-2">
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="アイテムを検索…"
                                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
                                autoFocus
                            />
                            <div className="max-h-40 overflow-y-auto space-y-1">
                                {filteredWardrobe?.map(w => (
                                    <button key={w.id} onClick={() => addItem(w)}
                                        className="w-full text-left flex items-center gap-2 text-sm px-2 py-1 hover:bg-muted rounded-md">
                                        {w.image_url
                                            ? <WardrobeImage itemId={w.id} className="w-8 h-8 rounded object-cover shrink-0" />
                                            : <div className="w-8 h-8 rounded bg-muted shrink-0" />}
                                        <span className="truncate">{w.name}</span>
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setShowItemSearch(false)} className="text-xs text-muted-foreground hover:text-foreground">閉じる</button>
                        </div>
                    )}

                    {/* notes */}
                    <div>
                        <label className="text-xs text-muted-foreground block mb-1">notes</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none" />
                    </div>
                </div>

                <div className="px-4 py-3 border-t flex items-center gap-2 shrink-0">
                    <button onClick={handleDelete} className="text-sm text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-md">削除</button>
                    <div className="flex-1" />
                    <button onClick={onClose} className="px-4 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted">閉じる</button>
                    <button onClick={save} disabled={saving} className="px-4 py-1.5 rounded-md text-sm bg-primary text-primary-foreground disabled:opacity-50">
                        {saving ? '保存中…' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── ページ ───────────────────────────────────────────────────────────────────
export default function OutfitsPage() {
    const [selected, setSelected] = useState<Outfit | null>(null)
    const [creating, setCreating] = useState(false)
    const [filterTag, setFilterTag] = useState('')
    const [useTemp, setUseTemp]   = useState(false)
    const { weather } = useWeather()
    const qc = useQueryClient()

    const { data: outfits, isLoading } = useQuery({
        queryKey: ['outfits', useTemp && weather ? Math.round(weather.temperature) : null],
        queryFn: () => outfitsApi.list(
            useTemp && weather ? { temp: String(Math.round(weather.temperature)) } : {},
        ),
    })

    const filtered = outfits?.filter(o =>
        !filterTag || o.tags.includes(filterTag),
    )

    // 全タグを収集
    const allTags = [...new Set((outfits ?? []).flatMap(o => o.tags))]

    async function createNew() {
        const outfit = await outfitsApi.create({})
        qc.invalidateQueries({ queryKey: ['outfits'] })
        setSelected(outfit)
    }

    return (
        <div className="p-4 space-y-4">
            {/* フィルタ */}
            <div className="flex flex-wrap gap-2 items-center">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={useTemp} onChange={e => setUseTemp(e.target.checked)} />
                    今日の気温で絞り込む
                    {weather && <span className="text-muted-foreground text-xs">（{Math.round(weather.temperature)}℃ ±3℃）</span>}
                </label>
                {allTags.length > 0 && (
                    <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
                        className="rounded-md border bg-background px-2 py-1 text-sm">
                        <option value="">タグ</option>
                        {allTags.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                )}
            </div>

            {isLoading && <p className="text-sm text-muted-foreground">読み込み中…</p>}

            {/* ギャラリー */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filtered?.map(outfit => (
                    <OutfitCard
                        key={outfit.id}
                        outfit={outfit}
                        onClick={() => setSelected(outfit)}
                    />
                ))}
            </div>

            {/* ＋ボタン */}
            <button
                onClick={createNew}
                className="fixed bottom-20 right-4 md:bottom-6 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
            >
                <Plus size={24} />
            </button>

            {/* 詳細パネル */}
            {selected && (
                <OutfitPanel
                    outfit={selected}
                    onClose={() => setSelected(null)}
                    onSaved={() => {
                        qc.invalidateQueries({ queryKey: ['outfits'] })
                        // パネルを最新データで更新
                        outfitsApi.get(selected.id).then(setSelected).catch(() => {})
                    }}
                />
            )}
        </div>
    )
}
