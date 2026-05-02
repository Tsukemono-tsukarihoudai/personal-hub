import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
    const navigate = useNavigate()
    const [log, setLog] = useState<string[]>([])

    const addLog = (msg: string) => {
        console.log('[AuthCallback]', msg)
        setLog(prev => [...prev, msg])
    }

    useEffect(() => {
        addLog(`URL: ${window.location.href}`)

        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const error = params.get('error')
        const errorDescription = params.get('error_description')

        addLog(`code: ${code ?? 'null'}`)
        addLog(`error: ${error ?? 'null'}`)
        addLog(`error_description: ${errorDescription ?? 'null'}`)

        if (error) {
            addLog(`Auth error from URL: ${error} - ${errorDescription}`)
            setTimeout(() => navigate('/login', { replace: true }), 3000)
            return
        }

        if (!code) {
            addLog('No code found. Checking existing session...')
            supabase.auth.getSession().then(({ data: { session }, error }) => {
                addLog(`getSession result: session=${!!session} error=${error?.message ?? 'null'}`)
                if (session) {
                    navigate('/', { replace: true })
                } else {
                    setTimeout(() => navigate('/login', { replace: true }), 3000)
                }
            })
            return
        }

        addLog('Exchanging code for session...')
        supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
            addLog(`exchangeCodeForSession: session=${!!data.session} error=${error?.message ?? 'null'}`)
            if (error) {
                setTimeout(() => navigate('/login', { replace: true }), 3000)
            } else {
                navigate('/', { replace: true })
            }
        })
    }, [navigate])

    return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 text-muted-foreground">
            <p>認証中…</p>
            <div className="text-xs text-left font-mono bg-muted p-4 rounded max-w-lg w-full">
                {log.map((l, i) => <div key={i}>{l}</div>)}
            </div>
        </div>
    )
}
