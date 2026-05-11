import type { Config } from 'tailwindcss'

export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                border:     'hsl(var(--border))',
                input:      'hsl(var(--input))',
                ring:       'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT:    'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                muted: {
                    DEFAULT:    'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                card: {
                    DEFAULT:    'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                sidebar: {
                    DEFAULT: 'hsl(var(--sidebar-bg))',
                    border:  'hsl(var(--sidebar-border))',
                },
            },
            fontFamily: {
                sans: [
                    'ui-sans-serif', '-apple-system', 'BlinkMacSystemFont',
                    'Segoe UI Variable Display', 'Segoe UI', 'Helvetica',
                    'Apple Color Emoji', 'Arial', 'sans-serif',
                ],
            },
            fontSize: {
                'notion-sm':   ['12px', { lineHeight: '1.5' }],
                'notion-base': ['14px', { lineHeight: '1.5' }],
                'notion-lg':   ['16px', { lineHeight: '1.4' }],
                'notion-xl':   ['20px', { lineHeight: '1.3', fontWeight: '600' }],
                'notion-2xl':  ['24px', { lineHeight: '1.3', fontWeight: '700' }],
            },
            spacing: {
                'notion-xs': '4px',
                'notion-sm': '8px',
                'notion-md': '12px',
                'notion-lg': '16px',
                'notion-xl': '24px',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
                'notion-sm': '3px',
                'notion-md': '4px',
                'notion-lg': '6px',
            },
        },
    },
    plugins: [],
} satisfies Config
