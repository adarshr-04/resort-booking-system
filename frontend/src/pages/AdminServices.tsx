import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { api, type ServiceRequest } from '@/lib/api'
import { 
  Utensils, SprayCan, Wrench, ConciergeBell, CheckCircle2, 
  Clock, AlertTriangle, RefreshCw, Filter, BellRing, Package
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

type FilterStatus = 'all' | 'pending' | 'accepted' | 'resolved' | 'cancelled'

const TYPE_CONFIG: Record<string, { icon: JSX.Element; label: string; color: string }> = {
  housekeeping: { icon: <SprayCan className="w-5 h-5" />, label: 'Housekeeping', color: 'text-blue-500' },
  maintenance:  { icon: <Wrench className="w-5 h-5" />, label: 'Maintenance', color: 'text-orange-500' },
  concierge:    { icon: <ConciergeBell className="w-5 h-5" />, label: 'Concierge', color: 'text-accent' },
  supplies:     { icon: <Package className="w-5 h-5" />, label: 'Supplies', color: 'text-purple-500' },
  other:        { icon: <BellRing className="w-5 h-5" />, label: 'Other', color: 'text-muted-foreground' },
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  pending:   { label: 'Needs Action', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  accepted:  { label: 'In Progress',  classes: 'bg-accent/10 text-accent border-accent/20' },
  resolved:  { label: 'Resolved',     classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled',    classes: 'bg-gray-50 text-gray-500 border-gray-200' },
}

export default function AdminServices() {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [updating, setUpdating] = useState<number | null>(null)

  const loadRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await api.getServiceRequests()
      setRequests(
        (Array.isArray(data) ? data : []).sort(
          (a: ServiceRequest, b: ServiceRequest) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      )
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Failed to load service requests', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRequests()
    const interval = setInterval(() => loadRequests(true), 15000) // poll every 15s
    return () => clearInterval(interval)
  }, [loadRequests])

  const handleStatusUpdate = async (id: number, status: string) => {
    setUpdating(id)
    try {
      await api.updateServiceStatus(id, status)
      await loadRequests(true)
    } catch (err) {
      console.error('Failed to update status', err)
    } finally {
      setUpdating(null)
    }
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  const counts = {
    pending:  requests.filter(r => r.status === 'pending').length,
    accepted: requests.filter(r => r.status === 'accepted').length,
    resolved: requests.filter(r => r.status === 'resolved').length,
    all:      requests.length,
  }

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4 md:px-6">

        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-light tracking-wide mb-1">Live Concierge Desk</h1>
            <p className="text-muted-foreground text-sm tracking-wide">
              Real-time guest service requests — auto-refreshes every 15 seconds
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
              Last refresh: {format(lastRefresh, 'hh:mm:ss a')}
            </span>
            <button 
              onClick={() => loadRequests()}
              className="flex items-center gap-2 px-4 py-2 border border-border text-[10px] tracking-widest uppercase font-bold hover:border-accent hover:text-accent transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </header>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'All Requests', count: counts.all, key: 'all', color: 'text-charcoal' },
            { label: 'Needs Action', count: counts.pending, key: 'pending', color: 'text-amber-600' },
            { label: 'In Progress', count: counts.accepted, key: 'accepted', color: 'text-accent' },
            { label: 'Resolved Today', count: counts.resolved, key: 'resolved', color: 'text-emerald-600' },
          ].map(stat => (
            <button
              key={stat.key}
              onClick={() => setFilter(stat.key as FilterStatus)}
              className={cn(
                "bg-background border p-5 text-left transition-all hover:border-accent/50 hover:shadow-sm",
                filter === stat.key ? "border-accent shadow-sm" : "border-border"
              )}
            >
              <p className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-1">{stat.label}</p>
              <p className={cn("text-3xl font-light", stat.color)}>{stat.count}</p>
            </button>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <div className="flex gap-2">
            {(['all', 'pending', 'accepted', 'resolved', 'cancelled'] as FilterStatus[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 text-[9px] tracking-[0.2em] uppercase font-bold border transition-all",
                  filter === f 
                    ? "bg-accent text-white border-accent"
                    : "border-border text-muted-foreground hover:border-accent/40"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 bg-background border border-dashed border-border">
            <BellRing className="w-10 h-10 text-accent/20 mx-auto mb-4" />
            <p className="text-sm italic text-muted-foreground">No {filter !== 'all' ? filter : ''} service requests found.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(req => {
              const typeConf = TYPE_CONFIG[req.request_type] || TYPE_CONFIG.other
              const statusConf = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending
              const isPending = req.status === 'pending'
              const isAccepted = req.status === 'accepted'

              return (
                <div
                  key={req.id}
                  className={cn(
                    "bg-background border p-6 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm transition-all",
                    isPending ? "border-amber-300 bg-amber-50/30" : "border-border hover:border-accent/30"
                  )}
                >
                  {/* Type Icon */}
                  <div className="flex flex-col items-center justify-center p-5 bg-secondary min-w-[90px] text-center shrink-0">
                    <span className={typeConf.color}>{typeConf.icon}</span>
                    <span className="text-[9px] tracking-widest uppercase mt-2 font-bold text-muted-foreground">
                      {typeConf.label}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className={cn("text-[9px] px-2.5 py-1 border uppercase tracking-widest font-bold", statusConf.classes)}>
                        {statusConf.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">
                        REQ-{req.id.toString().padStart(4, '0')}
                      </span>
                      {isPending && (
                        <span className="flex items-center gap-1 text-[9px] text-amber-600 font-bold uppercase tracking-widest animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> Urgent
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-medium text-charcoal mb-1 truncate">
                      "{req.description || 'No additional details provided.'}"
                    </p>

                    <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {format(new Date(req.created_at), 'dd MMM, hh:mm a')}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 min-w-[180px] shrink-0">
                    {isPending && (
                      <button
                        disabled={updating === req.id}
                        onClick={() => handleStatusUpdate(req.id, 'accepted')}
                        className="w-full py-3 bg-accent text-white text-[10px] tracking-widest uppercase font-bold hover:bg-accent/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {updating === req.id
                          ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : 'Accept & Dispatch'
                        }
                      </button>
                    )}
                    {isAccepted && (
                      <button
                        disabled={updating === req.id}
                        onClick={() => handleStatusUpdate(req.id, 'resolved')}
                        className="w-full py-3 bg-emerald-600/10 text-emerald-700 text-[10px] tracking-widest uppercase font-bold border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Mark Resolved
                      </button>
                    )}
                    {req.status !== 'cancelled' && req.status !== 'resolved' && (
                      <button
                        disabled={updating === req.id}
                        onClick={() => handleStatusUpdate(req.id, 'cancelled')}
                        className="w-full py-2 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-red-600 transition-colors font-bold text-center"
                      >
                        Cancel
                      </button>
                    )}
                    {(req.status === 'resolved' || req.status === 'cancelled') && (
                      <span className="text-center text-[9px] tracking-widest uppercase text-muted-foreground py-2">
                        {req.status === 'resolved' ? '✓ Closed' : '✗ Cancelled'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
