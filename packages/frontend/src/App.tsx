import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/layout/Layout'
import LoginPage from './components/auth/LoginPage'
import Dashboard from './components/dashboard/Dashboard'
import IdeasPage from './components/ideas/IdeasPage'
import WardrobePage from './components/wardrobe/WardrobePage'
import OutfitsPage from './components/outfits/OutfitsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { session, loading } = useAuth()
    if (loading) return <div className="flex h-screen items-center justify-center text-muted-foreground">読み込み中…</div>
    if (!session) return <Navigate to="/login" replace />
    return <>{children}</>
}

export default function App() {
    return (
        <HashRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Dashboard />} />
                    <Route path="ideas"    element={<IdeasPage />} />
                    <Route path="wardrobe" element={<WardrobePage />} />
                    <Route path="outfits"  element={<OutfitsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </HashRouter>
    )
}
