import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Lightbulb, Shirt, BookImage, LogOut } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const NAV_ITEMS = [
    { to: '/',         icon: LayoutDashboard, label: 'Home'     },
    { to: '/ideas',    icon: Lightbulb,       label: 'Ideas'    },
    { to: '/wardrobe', icon: Shirt,           label: 'Wardrobe' },
    { to: '/outfits',  icon: BookImage,       label: 'Outfits'  },
]

export default function Layout() {
    return (
        <div className="flex h-screen flex-col md:flex-row overflow-hidden bg-background">
            {/* サイドナビ（PC）/ ボトムバー（iOS） */}
            <nav className="
                flex md:flex-col
                md:w-16 md:h-full
                border-r border-sidebar-border
                fixed md:static bottom-0 left-0 right-0 md:bottom-auto
                bg-sidebar z-20
                md:py-4 py-2 px-4 md:px-0
                justify-around md:justify-start md:gap-1
            ">
                {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                            `flex flex-col md:flex-row items-center justify-center md:justify-center gap-1
                             p-2 rounded-lg text-xs md:text-base transition-colors
                             ${isActive
                                 ? 'text-foreground bg-muted'
                                 : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`
                        }
                    >
                        <Icon size={20} />
                        <span className="text-[10px] md:hidden">{label}</span>
                    </NavLink>
                ))}

                <button
                    onClick={() => supabase.auth.signOut()}
                    className="mt-auto flex items-center justify-center p-2 text-muted-foreground hover:text-foreground"
                >
                    <LogOut size={20} />
                </button>
            </nav>

            {/* メインコンテンツ */}
            <main className="flex-1 overflow-auto pb-16 md:pb-0">
                <Outlet />
            </main>
        </div>
    )
}
