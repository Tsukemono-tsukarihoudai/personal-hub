import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType:   'autoUpdate',
            // public/manifest.json と競合しないよう .webmanifest を使用
            // index.html の手動 <link rel="manifest"> は削除済み（プラグインが注入）
            includeAssets:  ['icon-192.png', 'icon-512.png'],
            manifest: {
                name:             'personal-hub',
                short_name:       'hub',
                display:          'standalone',
                theme_color:      '#000000',
                background_color: '#000000',
                icons: [
                    // 相対パスで指定（base: '/personal-hub/' でも正しく解決される）
                    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
                ],
            },
        }),
    ],
    // HashRouterのため、リポジトリ名に合わせて設定
    // カスタムドメイン使用時は base: '/' に変更する
    base: '/personal-hub/',
})
