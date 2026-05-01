# personal-hub

iOS/PC 向けのパーソナルダッシュボード。IDEA・タスク管理、ワードローブ管理、天気連動コーデ推薦。

## 構成

```
packages/
├── database/       Supabase マイグレーション SQL
├── idea-api/       Cloudflare Workers (IDEA・タスク CRUD + 配信バッチ)
├── wardrobe-api/   Cloudflare Workers (ワードローブ・コーデ CRUD + R2 画像)
└── frontend/       React + Vite + PWA (GitHub Pages)
```

## セットアップ

詳細は `H:\Claude\notes\personal-hub\progress.md` を参照。

### 1. Supabase

SQL Editor で以下を順に実行:

```
packages/database/migrations/001_enums.sql
packages/database/migrations/002_items.sql
packages/database/migrations/003_wardrobe.sql
packages/database/migrations/004_rls.sql
```

Auth → Settings で JWT expiry を `2592000`（30日）に設定。

### 2. Cloudflare Workers

```bash
# idea-api
cd packages/idea-api
npm install
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler deploy

# wardrobe-api
cd packages/wardrobe-api
npm install
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put R2_PUBLIC_URL
wrangler deploy
```

### 3. GitHub

- Settings → Pages → Source: **GitHub Actions**
- Settings → Secrets に以下を登録:
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - `VITE_IDEA_API_URL`, `VITE_WARDROBE_API_URL`
  - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SLACK_WEBHOOK_URL`（配信バッチ用）

### 4. Frontend（ローカル確認）

```bash
cd packages/frontend
cp .env.example .env
# .env を編集して各値を設定
npm install
npm run dev
```

## 注意

- `packages/frontend/public/icon-192.png` / `icon-512.png` はプレースホルダー。本番用アイコンに差し替えること。
- `vite.config.ts` の `base: '/personal-hub/'` はリポジトリ名に依存。カスタムドメイン使用時は `base: '/'` に変更。
