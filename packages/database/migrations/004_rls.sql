-- 004_rls.sql
-- Row Level Security 有効化・ポリシー設定

ALTER TABLE items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfits        ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_items   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated only" ON items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated only" ON wardrobe_items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated only" ON outfits
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated only" ON outfit_items
    FOR ALL USING (auth.role() = 'authenticated');
