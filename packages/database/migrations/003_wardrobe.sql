-- 003_wardrobe.sql
-- wardrobe_items / outfits / outfit_items テーブル

CREATE TABLE wardrobe_items (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    category   wardrobe_category,
    colors     TEXT[],
    seasons    TEXT[],
    tags       TEXT[],
    image_url  TEXT,
    notes      TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE outfits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT,
    tags            TEXT[],
    occasion        outfit_occasion,
    temperature_min INTEGER,
    temperature_max INTEGER,
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE outfit_items (
    outfit_id UUID REFERENCES outfits(id) ON DELETE CASCADE,
    item_id   UUID REFERENCES wardrobe_items(id) ON DELETE CASCADE,
    position  INTEGER,
    PRIMARY KEY (outfit_id, item_id)
);
