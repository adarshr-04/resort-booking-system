import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { api, type Booking } from '@/lib/api'
import { Calendar, Search, Filter, User as UserIcon, X, CheckCircle, XCircle } from 'lucide-react'

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  useEffect(() => {
    async function loadBookings() {
      try {
        const data = await api.getMyBookings()
        setBookings(data)
      } catch (err) {
        console.error('Failed to load bookings:', err)
      } finally {
        setLoading(false)
      }
    }
    loadBookings()
  }, [])

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await api.updateBookingStatus(id, status)
      // Refresh local state
      const updatedBookings = await api.getMyBookings()
      setBookings(updatedBookings)
      
      // Update selected booking if modal is open
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking({ ...selectedBooking, status: status as any })
      }
    } catch (err) {
      console.error('Failed to update booking status:', err)
    }
  }

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.id.toString().includes(search) || b.user.toString().includes(search)
    const matchesFilter = filter === 'all' || b.status === filter
    return matchesSearch && matchesFilter
  })

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4 md:px-6">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-light tracking-wide mb-2">Reservation Ledger</h1>
            <p className="text-muted-foreground text-sm tracking-wide">Manage and track all guest stays in real-time.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search Reference..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-accent w-64" 
              />
            </div>
            <select 
              value={filter}
              onChange={(e: any) => setFilter(e.target.value)}
              className="px-4 py-2 bg-background border border-border text-xs tracking-widest uppercase focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </header>

        <div className="bg-background border border-border shadow-sm">
          {loading ? (
            <div className="py-20 flex justify-center translate-y-2">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                    <th className="px-8 py-6 font-medium">Ref ID</th>
                    <th className="px-8 py-6 font-medium">Guest</th>
                    <th className="px-8 py-6 font-medium">Schedule</th>
                    <th className="px-8 py-6 font-medium">Total Price</th>
                    <th className="px-8 py-6 font-medium">Status</th>
                    <th className="px-8 py-6 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="group hover:bg-secondary/20 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-secondary flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-accent" />
                          </div>
                          <span className="text-sm font-medium tracking-wider">RES-{booking.id.toString().padStart(5, '0')}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-accent/5 rounded-full flex items-center justify-center">
                            <UserIcon className="w-3 h-3 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{booking.user_name || `User #${booking.user}`}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{booking.room_name || `Room #${booking.room}`}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-xs space-y-1">
                          <p><span className="text-muted-foreground mr-2">In:</span> {new Date(booking.check_in).toLocaleDateString('en-GB')}</p>
                          <p><span className="text-muted-foreground mr-2">Out:</span> {new Date(booking.check_out).toLocaleDateString('en-GB')}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-mono text-sm">
                        ₹ {Number(booking.total_price).toLocaleString()}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[9px] px-2.5 py-1 tracking-[0.15em] uppercase font-bold border ${
                          booking.status === 'confirmed' ? "bg-accent/5 border-accent text-accent" : 
                          booking.status === 'cancelled' ? "bg-destructive/5 border-destructive text-destructive" :
                          "bg-muted/5 border-border text-muted-foreground"
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-4">
                          {booking.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                className="text-[9px] tracking-[0.2em] uppercase font-bold text-accent hover:underline"
                              >
                                Confirm
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                className="text-[9px] tracking-[0.2em] uppercase font-bold text-destructive/70 hover:text-destructive"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => setSelectedBooking(booking)}
                            className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-accent transition-colors"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredBookings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center text-sm text-muted-foreground italic">
                        No reservations found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-background border border-border shadow-lg w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border bg-secondary/30">
              <div>
                <p className="text-[10px] tracking-widest uppercase text-accent mb-1">Reservation Details</p>
                <h3 className="text-xl font-light tracking-wide">RES-{selectedBooking.id.toString().padStart(5, '0')}</h3>
              </div>
              <button 
                onClick={() => setSelectedBooking(null)}
                className="p-2 hover:bg-secondary rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex justify-between items-center bg-secondary/20 p-4 border border-border">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Current Status</span>
                <span className={`text-[10px] px-3 py-1 tracking-[0.15em] uppercase font-bold border ${
                  selectedBooking.status === 'confirmed' ? "bg-accent/10 border-accent text-accent" : 
                  selectedBooking.status === 'cancelled' ? "bg-destructive/10 border-destructive text-destructive" :
                  "bg-muted/10 border-border text-muted-foreground"
                }`}>
                  {selectedBooking.status}
                </span>
              </div>

              {/* Guest Details */}
              <div>
                <h4 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
                  <UserIcon className="w-3 h-3" /> Guest Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Email</p>
                    <p className="font-medium">{selectedBooking.user_email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Phone</p>
                    <p className="font-medium">{selectedBooking.user_phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Stay Details */}
              <div>
                <h4 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Stay Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm bg-secondary/10 p-4 border border-border">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Room</p>
                    <p className="font-medium">{selectedBooking.room_name || `ID: ${selectedBooking.room}`}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Guests</p>
                    <p className="font-medium">{selectedBooking.guests} Person(s)</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Check-in</p>
                    <p className="font-medium">{new Date(selectedBooking.check_in).toLocaleDateString('en-GB')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Check-out</p>
                    <p className="font-medium">{new Date(selectedBooking.check_out).toLocaleDateString('en-GB')}</p>
                  </div>
                </div>
              </div>

              {/* Total Price */}
              <div className="flex justify-between items-end border-t border-border pt-4">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Total Revenue</span>
                <span className="text-xl font-mono">₹ {Number(selectedBooking.total_price).toLocaleString()}</span>
              </div>
            </div>

            {/* Action Footer */}
            {selectedBooking.status === 'pending' && (
              <div className="p-6 bg-secondary/50 border-t border-border flex gap-4">
                <button 
                  onClick={() => handleStatusUpdate(selectedBooking.id, 'cancelled')}
                  className="flex-1 py-3 text-xs tracking-widest uppercase font-medium border border-destructive text-destructive hover:bg-destructive/10 transition-colors flex justify-center items-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Reject Booking
                </button>
                <button 
                  onClick={() => handleStatusUpdate(selectedBooking.id, 'confirmed')}
                  className="flex-1 py-3 text-xs tracking-widest uppercase font-medium bg-accent text-white hover:bg-accent/90 transition-colors flex justify-center items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Confirm & Send Email
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
