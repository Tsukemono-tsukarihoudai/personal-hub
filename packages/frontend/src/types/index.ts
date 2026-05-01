export type ItemClass    = 'IDEA' | 'UNDIVIDED_TASK' | 'SUPER_TASK' | 'TODO_TASK'
export type ItemStatus   = '0%' | '20%' | '50%' | '80%' | 'DONE' | 'KILLED'
export type KillCategory = 'TIME' | 'COST' | 'PASSION' | 'TECH' | 'OTHER'

export interface Item {
    id:          string
    class:       ItemClass
    status:      ItemStatus
    title:       string
    description: string | null
    priority:    number
    effort:      number | null
    cost:        number | null
    parent_id:   string | null
    start_date:  string | null
    due_date:    string | null
    last_fed_at: string | null
    kill_cat:    KillCategory | null
    created_at:  string
    updated_at:  string
}

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

export const STATUS_ORDER: ItemStatus[] = ['0%', '20%', '50%', '80%', 'DONE', 'KILLED']
