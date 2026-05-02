import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
    const navigate = useNavigate()

    useEffect(() => {
        const code = new URLSearchParams(window.location.search).get('code')
        if (code) {
            supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
                navigate(error ? '/login' : '/', { replace: true })
            })
        } else {
            supabase.auth.getSession().then(({ data: { session } }) => {
                navigate(session ? '/' : '/login', { replace: true })
            })
        }
    }, [navigate])

    return (
        <div className="flex h-screen items-center justify-center text-muted-foreground">
            認証中…
        </div>
    )
}
