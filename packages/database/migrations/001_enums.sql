-- 001_enums.sql
-- Enum型定義

CREATE TYPE item_class AS ENUM (
    'IDEA', 'UNDIVIDED_TASK', 'SUPER_TASK', 'TODO_TASK'
);

CREATE TYPE item_status AS ENUM (
    '0%', '20%', '50%', '80%', 'DONE', 'KILLED'
);

CREATE TYPE kill_category AS ENUM (
    'TIME', 'COST', 'PASSION', 'TECH', 'OTHER'
);

CREATE TYPE wardrobe_category AS ENUM (
    'tops', 'bottoms', 'outer', 'shoes', 'accessory', 'bag', 'other'
);

CREATE TYPE outfit_occasion AS ENUM (
    'casual', 'office', 'formal', 'sport', 'outdoor', 'other'
);
