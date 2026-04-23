import { useState, useEffect } from 'react'
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  DoorOpen, 
  AlertCircle, 
  Hammer, 
  Sparkles,
  ArrowRight,
  ChevronRight,
  User as UserIcon,
  RefreshCcw,
  LogOut,
  ChevronDown
} from 'lucide-react'
import { api, type Booking, type Room } from '@/lib/api'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

type HousekeepingStatus = 'ready' | 'dirty' | 'maintenance'

interface StaffOverview {
  arrivals_today: Booking[]
  departures_today: Booking[]
  room_statuses: (Room & { housekeeping_status: HousekeepingStatus; housekeeping_status_display: string })[]
  active_requests: any[]
}

export default function StaffHub() {
  const [data, setData] = useState<StaffOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'activity' | 'housekeeping' | 'requests'>('activity')
  const [isUpdating, setIsUpdating] = useState<number | null>(null)

  const fetchData = async () => {
    try {
      const overview = await api.getDailyOverview() as unknown as StaffOverview
      setData(overview)
    } catch (error) {
      console.error('Failed to load staff overview:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Polling for real-time vibe
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleUpdateStatus = async (roomId: number, status: HousekeepingStatus) => {
    setIsUpdating(roomId)
    try {
      await api.updateRoomStatus(roomId, status)
      await fetchData()
    } catch (error) {
      console.error('Update failed:', error)
    } finally {
      setIsUpdating(null)
    }
  }

  const handleResolveRequest = async (requestId: number) => {
    try {
      await api.updateServiceRequestStatus(requestId, 'resolved')
      await fetchData()
    } catch (error) {
      console.error('Failed to resolve request:', error)
    }
  }

  const getStatusColor = (status: HousekeepingStatus) => {
    switch (status) {
      case 'ready': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      case 'dirty': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'maintenance': return 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
    }
  }

  const getStatusIcon = (status: HousekeepingStatus) => {
    switch (status) {
      case 'ready': return <Sparkles className="w-3.5 h-3.5" />
      case 'dirty': return <Clock className="w-3.5 h-3.5" />
      case 'maintenance': return <Hammer className="w-3.5 h-3.5" />
    }
  }

  const stats = {
    arrivals: data?.arrivals_today.length || 0,
    departures: data?.departures_today.length || 0,
    dirty: data?.room_statuses.filter(r => r.housekeeping_status === 'dirty').length || 0,
    requests: data?.active_requests.length || 0
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs tracking-[0.2em] uppercase opacity-50 font-bold">Synchronizing Nodes...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-200 selection:bg-accent selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#16191E] border-b border-white/5 px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-accent flex items-center justify-center rounded-none shadow-lg">
            <DoorOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-[0.1em] uppercase text-white">Staff Operations</h1>
            <p className="text-[10px] text-slate-500 tracking-wider">Live Inventory • Coorg Pristine Woods</p>
          </div>
        </div>
        <button onClick={() => window.location.href = '/admin/dashboard'} className="p-2 hover:bg-white/5 rounded-full transition-all">
          <LogOut className="w-5 h-5 text-slate-400 rotate-180" />
        </button>
      </header>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 border-b border-white/5 bg-[#16191E]/50">
        <div className="p-4 border-r border-white/5 flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">In</span>
          <span className="text-lg font-light text-white">{stats.arrivals}</span>
        </div>
        <div className="p-4 border-r border-white/5 flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Out</span>
          <span className="text-lg font-light text-white">{stats.departures}</span>
        </div>
        <div className="p-4 border-r border-white/5 flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-widest text-amber-500 font-bold">Dirty</span>
          <span className="text-lg font-light text-white">{stats.dirty}</span>
        </div>
        <div className="p-4 flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-widest text-accent font-bold">Tasks</span>
          <span className="text-lg font-light text-white">{stats.requests}</span>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 pb-24">
        {/* Tab Navigation */}
        <div className="flex bg-[#16191E] p-1 gap-1 mb-6 rounded-none border border-white/5">
          {(['activity', 'housekeeping', 'requests'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300",
                activeTab === tab 
                  ? "bg-accent text-white shadow-lg" 
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="space-y-4">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-500 px-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Today&apos;s Arrivals
                </h2>
                {data?.arrivals_today.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-600 italic">No scheduled arrivals for today.</p>
                ) : data?.arrivals_today.map(booking => (
                  <ArrivalCard key={booking.id} booking={booking} type="arrival" />
                ))}
              </div>

              <div className="pt-8 space-y-4">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-500 px-2">Scheduled Departures</h2>
                {data?.departures_today.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-600 italic">No scheduled departures for today.</p>
                ) : data?.departures_today.map(booking => (
                  <ArrivalCard key={booking.id} booking={booking} type="departure" />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'housekeeping' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data?.room_statuses.map(room => (
                <div key={room.id} className="bg-[#16191E] border border-white/5 p-4 flex flex-col justify-between aspect-square group hover:border-accent/40 transition-all duration-300">
                  <div>
                    <h3 className="text-lg font-light text-white mb-1">{room.name.split('#')[1] || room.id}</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter truncate">{room.name.split(' #')[0]}</p>
                  </div>

                  <div className="space-y-3">
                    <div className={cn(
                      "px-2 py-1 text-[9px] font-bold uppercase tracking-widest border w-fit flex items-center gap-1.5",
                      getStatusColor(room.housekeeping_status as HousekeepingStatus)
                    )}>
                      {getStatusIcon(room.housekeeping_status as HousekeepingStatus)}
                      {room.housekeeping_status_display}
                    </div>

                    <div className="flex gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(['ready', 'dirty', 'maintenance'] as HousekeepingStatus[]).map(status => (
                        <button
                          key={status}
                          disabled={isUpdating === room.id}
                          onClick={() => handleUpdateStatus(room.id, status)}
                          className={cn(
                            "flex-1 h-6 flex items-center justify-center border border-white/10 hover:bg-accent hover:border-accent transition-all",
                            room.housekeeping_status === status && "hidden"
                          )}
                          title={status}
                        >
                          {status === 'ready' && <Sparkles className="w-3 h-3" />}
                          {status === 'dirty' && <RefreshCcw className="w-3 h-3" />}
                          {status === 'maintenance' && <Hammer className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-3">
              {data?.active_requests.length === 0 ? (
                <div className="text-center py-20 bg-[#16191E] border border-white/5">
                  <AlertCircle className="w-8 h-8 text-slate-700 mx-auto mb-4" />
                  <p className="text-xs text-slate-500 tracking-widest uppercase">No Active Requests</p>
                </div>
              ) : data?.active_requests.map(req => (
                <div key={req.id} className="bg-[#16191E] border border-white/5 p-5 flex items-center justify-between hover:border-accent/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-accent/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">{req.request_type_display}</h4>
                      <p className="text-[10px] text-slate-500 uppercase flex items-center gap-2">
                        Room {req.room_name} • {format(new Date(req.created_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleResolveRequest(req.id)}
                    className="px-4 py-2 border border-accent text-accent text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all flex items-center gap-2"
                  >
                    Resolve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Refresh */}
      <button 
        onClick={fetchData}
        className="fixed bottom-6 right-6 w-14 h-14 bg-accent text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-50"
      >
        <RefreshCcw className={cn("w-6 h-6", loading && "animate-spin")} />
      </button>
    </div>
  )
}

function ArrivalCard({ booking, type }: { booking: Booking, type: 'arrival' | 'departure' }) {
  return (
    <div className="bg-[#16191E] border border-white/5 p-5 group hover:border-white/10 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-none bg-[#1F242A] flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-wider text-white uppercase">{booking.user_name || 'Anonymous Guest'}</p>
            <p className="text-[10px] text-slate-500 tracking-tighter uppercase">{booking.room_name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase text-accent tracking-widest">
            {type === 'arrival' ? 'CHECK-IN' : 'CHECK-OUT'}
          </p>
          <p className="text-[9px] text-slate-500">RES-{booking.id.toString().padStart(5, '0')}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
        <button className="flex-1 py-2 text-[9px] font-bold uppercase tracking-widest bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-500 transition-all">
          {type === 'arrival' ? 'Acknowledge Arrival' : 'Complete Checkout'}
        </button>
        <button className="px-3 py-2 bg-white/5 hover:bg-white/10">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
