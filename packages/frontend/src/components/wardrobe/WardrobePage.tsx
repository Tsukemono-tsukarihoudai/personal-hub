import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2 } from 'lucide-react'
import { wardrobeApi } from '../../lib/api'
import type { WardrobeItem, WardrobeCategory } from '../../types'
import WardrobeModal from './WardrobeModal'

const CATEGORIES: WardrobeCategory[] = ['tops', 'bottoms', 'outer', 'shoes', 'accessory', 'bag', 'other']

export default function WardrobePage() {
    const [filterCat,    setFilterCat]    = useState<WardrobeCategory | ''>('')
    const [filterSeason, setFilterSeason] = useState('')
    const [selected,     setSelected]     = useState<WardrobeItem | null>(null)
    const [stubbing,     setStubbing]     = useState(false) // + ボタンの作成中フラグ
    const qc = useQueryClient()

    const { data: items, isLoading } = useQuery({
        queryKey: ['wardrobe', filterCat, filterSeason],
        queryFn:  () => wardrobeApi.list({
            ...(filterCat    ? { category: filterCat }    : {}),
            ...(filterSeason ? { season:   filterSeason } : {}),
        }),
    })

    // + タップ時にスタブを先行生成してモーダルを開く
    async function handleCreateNew() {
        if (stubbing) return
        setStubbing(true)
        try {
            const id   = crypto.randomUUID()
            const stub = await wardrobeApi.create({ id, name: '' })
            qc.invalidateQueries({ queryKey: ['wardrobe'] })
            setSelected(stub)
        } catch (e) {
            console.error('スタブ作成失敗:', e)
        } finally {
            setStubbing(false)
        }
    }

    return (
        <div className="p-4 space-y-4">
            {/* フィルタ */}
            <div className="flex flex-wrap gap-2">
                <select
                    value={filterCat}
                    onChange={e => setFilterCat(e.target.value as WardrobeCategory | '')}
                    className="rounded-md border bg-background px-2 py-1 text-sm"
                >
                    <option value="">すべて</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                    value={filterSeason}
                    onChange={e => setFilterSeason(e.target.value)}
                    className="rounded-md border bg-background px-2 py-1 text-sm"
                >
                    <option value="">シーズン</option>
                    {['spring', 'summer', 'autumn', 'winter'].map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            {isLoading && <p className="text-sm text-muted-foreground">読み込み中…</p>}

            {/* グリッド（3列） */}
            <div className="grid grid-cols-3 gap-3">
                {items?.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setSelected(item)}
                        className="rounded-xl border overflow-hidden text-left hover:shadow-md transition-shadow"
                    >
                        {item.image_url
                            ? <img src={item.image_url} alt={item.name} className="w-full aspect-square object-cover" />
                            : <div className="w-full aspect-square bg-muted flex items-center justify-center text-muted-foreground text-xs">{item.category ?? '―'}</div>
                        }
                        <div className="p-2">
                            <p className="text-sm font-medium truncate">{item.name || '新規アイテム'}</p>
                            {item.tags.length > 0 && (
                                <p className="text-xs text-muted-foreground truncate">{item.tags.join(', ')}</p>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* ＋ボタン */}
            <button
                onClick={handleCreateNew}
                disabled={stubbing}
                className="fixed bottom-20 right-4 md:bottom-6 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg disabled:opacity-70"
            >
                {stubbing ? <Loader2 size={20} className="animate-spin" /> : <Plus size={24} />}
            </button>

            {selected && (
                <WardrobeModal
                    item={selected}
                    onClose={() => setSelected(null)}
                    onSaved={() => qc.invalidateQueries({ queryKey: ['wardrobe'] })}
                />
            )}
        </div>
    )
}
