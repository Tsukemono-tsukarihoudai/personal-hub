-- 002_items.sql
-- items テーブル・updated_at トリガー

CREATE TABLE items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class       item_class NOT NULL DEFAULT 'IDEA',
    status      item_status NOT NULL DEFAULT '0%',
    title       TEXT NOT NULL,
    description TEXT,
    priority    INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 10),
    effort      INTEGER CHECK (effort BETWEEN 1 AND 10),
    cost        INTEGER CHECK (cost BETWEEN 1 AND 10),
    parent_id   UUID REFERENCES items(id) ON DELETE SET NULL,
    start_date  DATE,
    due_date    DATE,
    last_fed_at TIMESTAMP WITH TIME ZONE,
    kill_cat    kill_category,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- updated_at 自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
