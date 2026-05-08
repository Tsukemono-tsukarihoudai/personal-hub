import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const WARDROBE_API = import.meta.env['VITE_WARDROBE_API_URL'] as string

interface Props {
    itemId: string
    version?: number
    className?: string
    alt?: string
}

export function WardrobeImage({ itemId, version = 0, className, alt = '' }: Props) {
    const [src, setSrc] = useState<string | null>(null)

    useEffect(() => {
        let blobUrl: string | null = null
        let cancelled = false

        async function load() {
            const { data } = await supabase.auth.getSession()
            const token = data.session?.access_token
            if (!token) return

            const res = await fetch(`${WARDROBE_API}/wardrobe/${itemId}/image`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok || cancelled) return

            const blob = await res.blob()
            if (cancelled) return

            blobUrl = URL.createObjectURL(blob)
            setSrc(blobUrl)
        }

        setSrc(null)
        load()

        return () => {
            cancelled = true
            if (blobUrl) URL.revokeObjectURL(blobUrl)
        }
    }, [itemId, version])

    return src ? <img src={src} className={className} alt={alt} /> : null
}
