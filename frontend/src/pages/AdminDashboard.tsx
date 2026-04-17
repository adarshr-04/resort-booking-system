import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatCard } from '@/components/dashboard/StatCard'
import { api, type Booking, type Room } from '@/lib/api'
import { Calendar, ArrowRight, User as UserIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [bookingsData, roomsData] = await Promise.all([
          api.getMyBookings(),
          api.getRooms()
        ])
        setBookings(bookingsData)
        setRooms(roomsData)
      } catch (error) {
        console.error('Dashboard data load failed:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Stat Calculations
  const today = new Date().toISOString().split('T')[0]
  
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed')
  const totalRevenue = confirmedBookings.reduce((acc, b) => acc + Number(b.total_price), 0)
  
  const pendingBookings = bookings.filter(b => b.status === 'pending').length
  
  const activeBookingsToday = confirmedBookings.filter(b => 
    b.check_in <= today && b.check_out >= today
  )
  const activeGuests = activeBookingsToday.reduce((acc, b) => acc + b.guests, 0)
  
  const occupiedRoomIds = new Set(activeBookingsToday.map(b => b.room))
  const occupancyRate = rooms.length > 0 
    ? Math.round((occupiedRoomIds.size / rooms.length) * 100) 
    : 0

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4 md:px-6">
        <header className="mb-10">
          <h1 className="text-3xl font-light tracking-wide mb-2">Director&apos;s Overview</h1>
          <p className="text-muted-foreground text-sm tracking-wide italic">Coorg Pristine Woods • Today, {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </header>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard label="Total Revenue" value={`₹ ${totalRevenue.toLocaleString()}`} trend="up" subValue="From confirmed stays" />
          <StatCard label="Occupancy" value={`${occupancyRate}%`} trend="neutral" subValue={`${rooms.length - occupiedRoomIds.size} Rooms available today`} />
          <StatCard label="Pending Enquiries" value={pendingBookings} trend="up" subValue="Requires attention" />
          <StatCard label="Active Guests" value={activeGuests} trend="up" subValue="Currently in-house" />
        </div>

        {/* Main Content Sections */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Activity Table */}
          <div className="lg:col-span-2 bg-background border border-border shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-light tracking-wide flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                Recent Ledger
              </h2>
              <Link to="/admin/bookings" className="text-[10px] tracking-widest uppercase text-accent hover:border-b border-accent transition-all">Full View</Link>
            </div>

            {loading ? (
              <div className="py-20 flex justify-center"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border text-[10px] tracking-widest uppercase text-muted-foreground">
                      <th className="pb-4 font-medium">Guest Ref</th>
                      <th className="pb-4 font-medium">Stay Period</th>
                      <th className="pb-4 font-medium text-right">Revenue</th>
                      <th className="pb-4 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {bookings.slice(0, 8).map((booking) => (
                      <tr key={booking.id} className="group hover:bg-secondary/20 transition-colors">
                        <td className="py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-none bg-secondary flex items-center justify-center">
                              <UserIcon className="w-3 h-3 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">RES-{booking.id.toString().padStart(4, '0')}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Room ID: {booking.room}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-5">
                          <p className="text-xs">{new Date(booking.check_in).toLocaleDateString('en-GB')} — {new Date(booking.check_out).toLocaleDateString('en-GB')}</p>
                        </td>
                        <td className="py-5 font-mono text-xs text-right">
                          ₹ {Number(booking.total_price).toLocaleString()}
                        </td>
                        <td className="py-5 text-center">
                          <span className={`text-[9px] px-2 py-0.5 tracking-widest uppercase font-bold ${
                            booking.status === 'confirmed' ? "bg-accent/10 text-accent" : 
                            booking.status === 'cancelled' ? "bg-destructive/10 text-destructive" :
                            "bg-muted/10 text-muted-foreground"
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {bookings.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-sm text-muted-foreground italic">
                          No bookings found in the database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions / Shortcuts */}
          <div className="space-y-6">
            <div className="bg-primary text-primary-foreground p-8">
              <h3 className="text-lg font-light tracking-wide mb-4 italic">Concierge Quick Launch</h3>
              <p className="text-xs text-primary-foreground/70 mb-8 leading-relaxed">Swiftly manage guest arrivals and room distributions from the central node.</p>
              <div className="space-y-3">
                <Link to="/admin/rooms" className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-[10px] tracking-widest uppercase transition-all flex items-center justify-between px-4">
                  Manage Inventory <ArrowRight className="w-3 h-3" />
                </Link>
                <Link to="/" className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-[10px] tracking-widest uppercase transition-all flex items-center justify-between px-4">
                  Public Website <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="bg-background border border-border p-8">
              <h3 className="text-sm tracking-wider uppercase mb-6 text-accent">Staff Memo</h3>
              <div className="space-y-4">
                <div className="border-l-2 border-accent pl-4">
                  <p className="text-xs font-medium mb-1">VIP Arrival: Lord Hamilton</p>
                  <p className="text-[10px] text-muted-foreground">Suite 402 — 14:00 Check-in</p>
                </div>
                <div className="border-l-2 border-border pl-4">
                  <p className="text-xs font-medium mb-1">System Health</p>
                  <p className="text-[10px] text-muted-foreground">All nodes operational. Real-time sync enabled.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
