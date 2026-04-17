import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Calendar, 
  Bed, 
  Users, 
  Settings, 
  TrendingUp, 
  LogOut,
  Bell,
  Search,
  ConciergeBell
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

interface SidebarLinkProps {
  href: string
  label: string
  Icon: any
  active?: boolean
}

function SidebarLink({ href, label, Icon, active }: SidebarLinkProps) {
  return (
    <Link to={href} className={cn(
      "flex items-center gap-3 px-4 py-3 text-sm tracking-wider uppercase transition-all duration-300",
      active 
        ? "bg-accent text-accent-foreground border-r-2 border-primary" 
        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    )}>
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </Link>
  )
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  return (
    <div className="flex h-screen bg-secondary">
      {/* Sidebar */}
      <aside className="w-64 bg-background border-r border-border hidden lg:flex flex-col">
        <div className="p-8 pb-12">
          <Link to="/" className="flex flex-col items-center group">
            <span className="text-xl font-light tracking-[0.2em]">PRISTINE WOODS</span>
            <span className="text-[10px] tracking-[0.3em] uppercase text-accent font-medium">COORG</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarLink href="/admin/dashboard" label="Overview" Icon={LayoutDashboard} active={location.pathname === '/admin/dashboard'} />
          <SidebarLink href="/admin/bookings" label="Bookings" Icon={Calendar} active={location.pathname === '/admin/bookings'} />
          <SidebarLink href="/admin/rooms" label="Inventory" Icon={Bed} active={location.pathname === '/admin/rooms'} />
          <SidebarLink href="/admin/guests" label="Guests" Icon={Users} active={location.pathname === '/admin/guests'} />
          <SidebarLink href="/admin/services" label="Services" Icon={ConciergeBell} active={location.pathname === '/admin/services'} />
          <SidebarLink href="/admin/analytics" label="Revenue" Icon={TrendingUp} active={location.pathname === '/admin/analytics'} />
          <SidebarLink href="/admin/settings" label="Settings" Icon={Settings} active={location.pathname === '/admin/settings'} />
        </nav>

        <div className="p-6 border-t border-border">
          <button onClick={() => api.logout()} className="flex items-center gap-3 text-xs tracking-widest uppercase text-muted-foreground hover:text-destructive transition-colors w-full px-4">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-background border-b border-border flex items-center justify-between px-8">
          <div className="flex items-center gap-4 bg-secondary px-4 py-2 rounded-none border border-border w-96">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search guests, bookings..." className="bg-transparent border-none text-sm focus:outline-none w-full" />
          </div>

          <div className="flex items-center gap-6">
            {/* Notifications and Profile removed per request or pending implementation */}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-secondary/30">
          {children}
        </main>
      </div>
    </div>
  )
}
