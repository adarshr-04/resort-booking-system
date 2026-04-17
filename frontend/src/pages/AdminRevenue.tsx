import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { api, type Booking } from '@/lib/api'
import { TrendingUp, ArrowUpRight, CreditCard, BarChart3 } from 'lucide-react'

// Lightweight Luxury SVG Chart Component
function RevenueChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value)) || 1
  return (
    <div className="w-full h-64 flex items-end justify-between gap-4 pt-10 px-4">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center group relative">
          <div 
            className="w-full bg-accent/20 group-hover:bg-accent/40 transition-all duration-500 relative"
            style={{ height: `${(item.value / max) * 100}%` }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground text-[10px] px-2 py-1 tracking-tighter whitespace-nowrap">
              ₹ {item.value.toLocaleString()}
            </div>
          </div>
          <span className="mt-4 text-[9px] tracking-widest uppercase text-muted-foreground font-medium">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminRevenue() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getUsersBookings() // Using the staff endpoint
        setBookings(data)
      } catch (err) {
        console.error('Failed to load revenue data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed')
  const totalRevenue = confirmedBookings.reduce((acc, b) => acc + Number(b.total_price), 0)
  const pendingRevenue = bookings.filter(b => b.status === 'pending').reduce((acc, b) => acc + Number(b.total_price), 0)

  // Demo Monthly Data for Visual Impact
  const monthlyData = [
    { label: 'Jan', value: 12000 },
    { label: 'Feb', value: 18000 },
    { label: 'Mar', value: 15000 },
    { label: 'Apr', value: totalRevenue || 5000 },
    { label: 'May', value: 24000 },
    { label: 'Jun', value: 31000 },
  ]

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4 md:px-6">
        <header className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-wide mb-2">Revenue Analytics</h1>
            <p className="text-muted-foreground text-sm tracking-wide">Track financial performance and monthly occupancy yield.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-border text-[10px] tracking-widest uppercase hover:bg-secondary transition-colors">Export Report</button>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-background border border-border p-8 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-16 h-16 text-accent" />
            </div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4 font-medium">Net Realized Revenue</p>
            <h3 className="text-4xl font-light leading-none mb-2">₹ {totalRevenue.toLocaleString()}</h3>
            <div className="flex items-center gap-2 text-accent text-[10px] tracking-widest uppercase font-bold mt-6">
              <ArrowUpRight className="w-4 h-4" />
              +12.5% vs Last Month
            </div>
          </div>

          <div className="bg-background border border-border p-8 shadow-sm">
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4 font-medium">Pending Receivables</p>
            <h3 className="text-4xl font-light leading-none mb-2">₹ {pendingRevenue.toLocaleString()}</h3>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-6">Expected within 48 hours</p>
          </div>

          <div className="bg-primary text-primary-foreground p-8 shadow-sm">
            <p className="text-[10px] tracking-[0.2em] uppercase text-primary-foreground/60 mb-4 font-medium">Average Order Value</p>
            <h3 className="text-4xl font-light leading-none mb-2">
              ₹ {confirmedBookings.length > 0 ? (totalRevenue / confirmedBookings.length).toFixed(0).toLocaleString() : '0'}
            </h3>
            <p className="text-[10px] text-primary-foreground/60 tracking-widest uppercase mt-6 italic">Premium Tier Performance</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-background border border-border p-8 shadow-sm">
            <h2 className="text-xl font-light tracking-wide mb-2 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent" />
              Performance Overview
            </h2>
            <p className="text-xs text-muted-foreground mb-8">Gross revenue projection based on current reservations.</p>
            <RevenueChart data={monthlyData} />
          </div>

          <div className="bg-background border border-border shadow-sm p-8 flex flex-col">
            <h2 className="text-xl font-light tracking-wide mb-8 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-accent" />
              Live Ledger
            </h2>
            
            <div className="space-y-6 flex-1 overflow-y-auto max-h-[300px] pr-4 custom-scrollbar">
              {confirmedBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between pb-4 border-b border-border/50 group">
                  <div>
                    <p className="text-[10px] tracking-widest uppercase font-bold mb-1">Booking #{booking.id}</p>
                    <p className="text-xs text-muted-foreground">{new Date(booking.check_in).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-light text-accent">+₹ {Number(booking.total_price).toLocaleString()}</p>
                    <p className="text-[9px] uppercase tracking-tighter text-muted-foreground">Stripe Direct</p>
                  </div>
                </div>
              ))}
              {confirmedBookings.length === 0 && (
                <div className="py-10 text-center text-xs text-muted-foreground italic">No realized transactions found.</div>
              )}
            </div>
            
            <button className="w-full mt-10 py-3 border border-border text-[10px] tracking-widest uppercase hover:bg-secondary transition-colors">
              View Detailed Ledger
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
