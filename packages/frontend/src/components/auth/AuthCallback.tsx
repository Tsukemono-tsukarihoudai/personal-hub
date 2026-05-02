import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
    const navigate = useNavigate()

    useEffect(() => {
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                navigate('/', { replace: true })
            } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
                navigate('/login', { replace: true })
            }
        })
    }, [navigate])

    return (
        <div className="flex h-screen items-center justify-center text-muted-foreground">
            認証中…
        </div>
    )
}
