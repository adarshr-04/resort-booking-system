import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatCard } from '@/components/dashboard/StatCard'
import { api, type Booking, type Room } from '@/lib/api'
import { 
  Calendar, ArrowRight, User as UserIcon, LogIn, LogOut,
  BedDouble, AlertTriangle, RefreshCw, CheckCircle2, Clock
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [dailyData, setDailyData] = useState<{
    arrivals_today: Booking[]
    departures_today: Booking[]
    room_statuses: (Room & { housekeeping_status: string; housekeeping_status_display: string })[]
    active_requests: any[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [bookingsData, roomsData, daily] = await Promise.all([
        api.getMyBookings(),
        api.getRooms(),
        api.getDailyOverview().catch(() => null),
      ])
      setBookings(bookingsData)
      setRooms(roomsData)
      if (daily) setDailyData(daily)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Dashboard data load failed:', error)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(() => loadData(true), 30000)
    return () => clearInterval(interval)
  }, [loadData])

  // Stat Calculations
  const today = new Date().toISOString().split('T')[0]
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed')
  const totalRevenue = confirmedBookings.reduce((acc, b) => acc + Number(b.total_price), 0)
  const pendingBookings = bookings.filter(b => b.status === 'pending').length
  const activeBookingsToday = confirmedBookings.filter(b => b.check_in <= today && b.check_out >= today)
  const activeGuests = activeBookingsToday.reduce((acc, b) => acc + b.guests, 0)
  const occupiedRoomIds = new Set(activeBookingsToday.map(b => b.room))
  const totalCapacity = rooms.reduce((s, r) => s + (r.total_inventory || 1), 0)
  const occupancyRate = totalCapacity > 0 ? Math.round((occupiedRoomIds.size / totalCapacity) * 100) : 0

  const arrivals = dailyData?.arrivals_today ?? []
  const departures = dailyData?.departures_today ?? []
  const roomStatuses = dailyData?.room_statuses ?? rooms
  const pendingRequests = dailyData?.active_requests?.length ?? 0

  const HOUSEKEEPING_COLOR: Record<string, string> = {
    ready:      'bg-emerald-50 text-emerald-700 border-emerald-200',
    cleaning:   'bg-amber-50 text-amber-700 border-amber-200',
    occupied:   'bg-accent/10 text-accent border-accent/20',
    maintenance:'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4 md:px-6">

        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light tracking-wide mb-1">Director's Overview</h1>
            <p className="text-muted-foreground text-sm tracking-wide italic">
              Coorg Pristine Woods • {format(new Date(), 'EEEE, dd MMMM yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
              Refreshed: {format(lastRefresh, 'hh:mm:ss a')}
            </span>
            <button
              onClick={() => loadData()}
              className="flex items-center gap-2 px-4 py-2 border border-border text-[10px] tracking-widest uppercase font-bold hover:border-accent hover:text-accent transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard label="Total Revenue" value={`₹ ${totalRevenue.toLocaleString()}`} trend="up" subValue="From confirmed stays" />
          <StatCard label="Occupancy" value={`${occupancyRate}%`} trend="neutral" subValue={`${totalCapacity - occupiedRoomIds.size} units available today`} />
          <StatCard label="Pending Enquiries" value={pendingBookings} trend="up" subValue="Requires attention" />
          <StatCard label="Active Guests" value={activeGuests} trend="up" subValue="Currently in-house" />
        </div>

        {/* ─── FRONT DESK: Today's Arrivals & Departures ─── */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">

          {/* Arrivals */}
          <div className="bg-background border border-border shadow-sm">
            <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-accent/5">
              <h2 className="text-sm font-medium tracking-wide flex items-center gap-2">
                <LogIn className="w-4 h-4 text-accent" /> Arrivals Today
              </h2>
              <span className="text-[10px] font-bold text-accent bg-accent/10 px-2.5 py-1 border border-accent/20">
                {arrivals.length} Expected
              </span>
            </div>
            {loading ? (
              <div className="py-12 flex justify-center"><div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
            ) : arrivals.length === 0 ? (
              <div className="py-12 text-center text-sm italic text-muted-foreground flex flex-col items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                No arrivals scheduled for today.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {arrivals.map(b => (
                  <div key={b.id} className="flex items-center justify-between px-8 py-4 hover:bg-secondary/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 bg-accent/10 flex items-center justify-center shrink-0">
                        <UserIcon className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{b.user_name || `Guest #${b.user}`}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{b.room_name} · {b.guests} guest{b.guests > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-widest font-bold text-accent">RES-{b.id.toString().padStart(4,'0')}</p>
                      <p className="text-[10px] text-muted-foreground">Until {format(new Date(b.check_out), 'dd MMM')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Departures */}
          <div className="bg-background border border-border shadow-sm">
            <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-amber-50/60">
              <h2 className="text-sm font-medium tracking-wide flex items-center gap-2">
                <LogOut className="w-4 h-4 text-amber-600" /> Departures Today
              </h2>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 border border-amber-200">
                {departures.length} Checking Out
              </span>
            </div>
            {loading ? (
              <div className="py-12 flex justify-center"><div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
            ) : departures.length === 0 ? (
              <div className="py-12 text-center text-sm italic text-muted-foreground flex flex-col items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                No departures scheduled for today.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {departures.map(b => (
                  <div key={b.id} className="flex items-center justify-between px-8 py-4 hover:bg-amber-50/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 bg-amber-50 flex items-center justify-center shrink-0">
                        <UserIcon className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{b.user_name || `Guest #${b.user}`}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{b.room_name} · {b.guests} guest{b.guests > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-widest font-bold text-amber-600">Checkout</p>
                      <p className="text-[10px] text-muted-foreground font-mono">₹{Number(b.total_price).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Room Status Board ─── */}
        <div className="bg-background border border-border shadow-sm mb-8">
          <div className="flex items-center justify-between px-8 py-5 border-b border-border">
            <h2 className="text-sm font-medium tracking-wide flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-accent" /> Room Status Board
            </h2>
            <Link to="/admin/rooms" className="text-[10px] tracking-widest uppercase text-accent hover:underline">
              Manage Rooms
            </Link>
          </div>
          {loading ? (
            <div className="py-12 flex justify-center"><div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-8">
              {roomStatuses.map((room: any) => {
                const status = room.housekeeping_status || 'ready'
                return (
                  <div key={room.id} className={cn("border p-4 text-center transition-all hover:shadow-sm", HOUSEKEEPING_COLOR[status] || HOUSEKEEPING_COLOR.ready)}>
                    <BedDouble className="w-5 h-5 mx-auto mb-2 opacity-60" />
                    <p className="text-[10px] font-bold uppercase tracking-widest truncate">{room.name}</p>
                    <p className="text-[9px] mt-1 opacity-80 capitalize">
                      {room.housekeeping_status_display || status}
                    </p>
                    {room.total_inventory > 1 && (
                      <p className="text-[9px] mt-0.5 opacity-60">{room.total_inventory} units</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ─── Bottom Row ─── */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Recent Bookings Table */}
          <div className="lg:col-span-2 bg-background border border-border shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-light tracking-wide flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" /> Recent Ledger
              </h2>
              <Link to="/admin/bookings" className="text-[10px] tracking-widest uppercase text-accent hover:border-b border-accent transition-all">Full View</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
                    <th className="pb-3 font-medium">Ref</th>
                    <th className="pb-3 font-medium">Guest</th>
                    <th className="pb-3 font-medium">Stay</th>
                    <th className="pb-3 font-medium text-right">Revenue</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {bookings.slice(0, 6).map(b => (
                    <tr key={b.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-4 text-xs font-medium">RES-{b.id.toString().padStart(4,'0')}</td>
                      <td className="py-4">
                        <p className="text-xs font-medium">{b.user_name || `#${b.user}`}</p>
                        <p className="text-[9px] text-muted-foreground">{b.room_name}</p>
                      </td>
                      <td className="py-4 text-[10px] text-muted-foreground">
                        {format(new Date(b.check_in), 'dd MMM')} → {format(new Date(b.check_out), 'dd MMM')}
                      </td>
                      <td className="py-4 text-xs font-mono text-right">₹{Number(b.total_price).toLocaleString()}</td>
                      <td className="py-4 text-center">
                        <span className={cn("text-[8px] px-2 py-0.5 tracking-widest uppercase font-bold border",
                          b.status === 'confirmed' ? "bg-accent/10 text-accent border-accent/20" :
                          b.status === 'cancelled' ? "bg-red-50 text-red-600 border-red-200" :
                          b.status === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr><td colSpan={5} className="py-10 text-center text-sm text-muted-foreground italic">No bookings found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-primary text-primary-foreground p-8">
              <h3 className="text-base font-light tracking-wide mb-1 italic">Quick Launch</h3>
              <p className="text-xs text-primary-foreground/60 mb-6 leading-relaxed">Jump to any management section.</p>
              <div className="space-y-2.5">
                {[
                  { to: '/admin/bookings', label: 'Reservation Ledger' },
                  { to: '/admin/services', label: 'Concierge Desk' },
                  { to: '/admin/rooms',    label: 'Room Inventory' },
                  { to: '/admin/staff-hub', label: 'Staff Operations' },
                  { to: '/',              label: 'Public Website' },
                ].map(link => (
                  <Link key={link.to} to={link.to} className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-[10px] tracking-widest uppercase transition-all flex items-center justify-between px-4">
                    {link.label} <ArrowRight className="w-3 h-3" />
                  </Link>
                ))}
              </div>
            </div>

            {pendingRequests > 0 && (
              <Link to="/admin/services" className="block bg-amber-50 border border-amber-200 p-6 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">Pending Service Requests</span>
                </div>
                <p className="text-2xl font-light text-amber-700">{pendingRequests}</p>
                <p className="text-[10px] uppercase tracking-widest text-amber-600 mt-1 font-bold">Tap to view →</p>
              </Link>
            )}

            <div className="bg-background border border-border p-6">
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground mb-4">System Status</h3>
              <div className="space-y-3">
                {[
                  { label: 'Booking Engine',    ok: true },
                  { label: 'Payment Gateway',   ok: true },
                  { label: 'Email Delivery',    ok: true },
                  { label: 'Real-time Sync',    ok: true },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{s.label}</span>
                    <span className={cn("flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest",
                      s.ok ? "text-emerald-600" : "text-red-500"
                    )}>
                      <Clock className={cn("w-3 h-3", s.ok ? "text-emerald-400" : "text-red-400")} />
                      {s.ok ? 'Online' : 'Offline'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
