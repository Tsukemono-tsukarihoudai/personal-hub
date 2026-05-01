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

export interface Env {
    SUPABASE_URL:         string
    SUPABASE_SERVICE_KEY: string
}
