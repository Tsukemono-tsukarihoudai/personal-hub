import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function LoginPage() {
    const { session } = useAuth()
    const navigate    = useNavigate()
    const [email, setEmail]     = useState('')
    const [sent, setSent]       = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState<string | null>(null)

    useEffect(() => {
        if (session) navigate('/', { replace: true })
    }, [session, navigate])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: 'https://tsukemono-tsukarihoudai.github.io/personal-hub/#/auth/callback' },
        })

        if (error) setError(error.message)
        else setSent(true)
        setLoading(false)
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm space-y-6">
                <h1 className="text-2xl font-bold text-center">personal-hub</h1>

                {sent ? (
                    <p className="text-center text-muted-foreground">
                        メールを送信しました。<br />リンクをクリックしてログインしてください。
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="メールアドレス"
                            required
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        />
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                        >
                            {loading ? '送信中…' : 'Magic Linkを送る'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
