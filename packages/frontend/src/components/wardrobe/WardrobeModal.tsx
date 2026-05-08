import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Upload } from 'lucide-react'
import { wardrobeApi } from '../../lib/api'
import type { WardrobeItem, WardrobeCategory, Outfit } from '../../types'
import { WardrobeImage } from '../WardrobeImage'

interface Props {
    item:    WardrobeItem | null
    onClose: () => void
    onSaved: () => void
}

const CATEGORIES: WardrobeCategory[] = ['tops', 'bottoms', 'outer', 'shoes', 'accessory', 'bag', 'other']
const SEASONS = ['spring', 'summer', 'autumn', 'winter']

function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
    const [input, setInput] = useState('')
    function add() {
        const t = input.trim()
        if (t && !value.includes(t)) onChange([...value, t])
        setInput('')
    }
    return (
        <div className="flex flex-wrap gap-1 rounded-md border p-1.5 min-h-[38px]">
            {value.map(tag => (
                <span key={tag} className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs">
                    {tag}
                    <button onClick={() => onChange(value.filter(t => t !== tag))} className="text-muted-foreground hover:text-foreground">×</button>
                </span>
            ))}
            <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
                onBlur={add}
                placeholder="追加…"
                className="flex-1 min-w-[60px] bg-transparent text-sm outline-none"
            />
        </div>
    )
}

// item は常に非 null（WardrobePage がスタブを先行生成してから渡す）
export default function WardrobeModal({ item, onClose, onSaved }: Props) {
    const [name,     setName]     = useState(item?.name ?? '')
    const [category, setCategory] = useState<WardrobeCategory | ''>(item?.category ?? '')
    const [colors,   setColors]   = useState<string[]>(item?.colors ?? [])
    const [seasons,  setSeasons]  = useState<string[]>(item?.seasons ?? [])
    const [tags,     setTags]     = useState<string[]>(item?.tags ?? [])
    const [notes,    setNotes]    = useState(item?.notes ?? '')
    const [imageVersion, setImageVersion] = useState(0)
    const hasImage = !!(item?.image_url) || imageVersion > 0
    const [saving,   setSaving]   = useState(false)
    const [error,    setError]    = useState<string | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    const { data: relatedOutfits } = useQuery<Outfit[]>({
        queryKey: ['wardrobe', item?.id, 'outfits'],
        queryFn:  () => wardrobeApi.outfits(item!.id),
        enabled:  !!item,
    })

    async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file || !item) return
        try {
            await wardrobeApi.uploadImage(item.id, file)
            setImageVersion(v => v + 1)
        } catch (e) {
            setError((e as Error).message)
        }
    }

    async function save() {
        if (!name.trim()) { setError('名前は必須です'); return }
        setSaving(true)
        setError(null)
        try {
            await wardrobeApi.update(item!.id, {
                name,
                category: category || null,
                colors, seasons, tags,
                notes: notes || null,
            })
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
        if (!confirm(`「${item.name}」を削除しますか？R2の画像も削除されます。`)) return
        await wardrobeApi.delete(item.id)
        onSaved()
        onClose()
    }

    return (
        <div className="fixed inset-0 z-40 flex md:justify-end" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="w-full md:w-[440px] h-full bg-background border-l flex flex-col overflow-hidden shadow-xl md:relative absolute bottom-0 max-h-[92vh] md:max-h-full rounded-t-2xl md:rounded-none">
                {/* ヘッダー */}
                <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
                    <span className="flex-1 font-semibold">{item?.name || '新規アイテム'}</span>
                    <button onClick={onClose}><X size={18} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {error && <p className="text-sm text-red-500">{error}</p>}

                    {/* 画像 */}
                    <div className="flex flex-col items-center gap-2">
                        {hasImage && item
                            ? <WardrobeImage itemId={item.id} version={imageVersion} className="w-full max-h-48 object-cover rounded-xl" />
                            : <div className="w-full h-36 bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
                                <Upload size={24} />
                              </div>
                        }
                        <button
                            onClick={() => fileRef.current?.click()}
                            className="text-sm text-muted-foreground hover:text-foreground"
                        >画像を変更</button>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </div>

                    {/* 名前 */}
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="名前"
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />

                    {/* カテゴリ */}
                    <div>
                        <label className="text-xs text-muted-foreground block mb-1">category</label>
                        <select value={category} onChange={e => setCategory(e.target.value as WardrobeCategory | '')}
                            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm">
                            <option value="">未選択</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* colors */}
                    <div>
                        <label className="text-xs text-muted-foreground block mb-1">colors</label>
                        <TagInput value={colors} onChange={setColors} />
                    </div>

                    {/* seasons */}
                    <div>
                        <label className="text-xs text-muted-foreground block mb-1">seasons</label>
                        <div className="flex gap-2 flex-wrap">
                            {SEASONS.map(s => (
                                <label key={s} className="flex items-center gap-1 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={seasons.includes(s)}
                                        onChange={e => setSeasons(
                                            e.target.checked ? [...seasons, s] : seasons.filter(x => x !== s),
                                        )}
                                    />
                                    {s}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* tags */}
                    <div>
                        <label className="text-xs text-muted-foreground block mb-1">tags</label>
                        <TagInput value={tags} onChange={setTags} />
                    </div>

                    {/* notes */}
                    <div>
                        <label className="text-xs text-muted-foreground block mb-1">notes</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={3}
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
                        />
                    </div>

                    {/* 関連コーデ */}
                    {relatedOutfits && relatedOutfits.length > 0 && (
                        <div>
                            <label className="text-xs text-muted-foreground block mb-2">関連コーデ</label>
                            <div className="flex gap-2 flex-wrap">
                                {relatedOutfits.map(outfit => (
                                    <span key={outfit.id} className="rounded-lg border px-3 py-1.5 text-xs">
                                        {outfit.name ?? '無題'}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* フッター */}
                <div className="px-4 py-3 border-t flex items-center gap-2 shrink-0">
                    <button onClick={handleDelete} className="text-sm text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-md">削除</button>
                    <div className="flex-1" />
                    <button onClick={onClose} className="px-4 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted">キャンセル</button>
                    <button onClick={save} disabled={saving} className="px-4 py-1.5 rounded-md text-sm bg-primary text-primary-foreground disabled:opacity-50">
                        {saving ? '保存中…' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    )
}
