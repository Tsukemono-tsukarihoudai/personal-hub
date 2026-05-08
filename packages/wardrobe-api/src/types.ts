export type WardrobeCategory =
    'tops' | 'bottoms' | 'outer' | 'shoes' | 'accessory' | 'bag' | 'other'

export type OutfitOccasion =
    'casual' | 'office' | 'formal' | 'sport' | 'outdoor' | 'other'

export interface WardrobeItem {
    id:         string
    name:       string
    category:   WardrobeCategory | null
    colors:     string[]
    seasons:    string[]
    tags:       string[]
    image_url:  string | null
    notes:      string | null
    created_at: string
}

export interface Outfit {
    id:              string
    name:            string | null
    tags:            string[]
    occasion:        OutfitOccasion | null
    temperature_min: number | null
    temperature_max: number | null
    notes:           string | null
    created_at:      string
    items:           WardrobeItem[]
}

export interface Env {
    SUPABASE_URL:         string
    SUPABASE_SERVICE_KEY: string
    ALLOWED_EMAIL?:       string
    R2_PUBLIC_URL:        string   // R2カスタムドメインまたは公開URL（例: https://pub.example.com）
    R2:                   R2Bucket // Cloudflare Workers R2 binding
}
