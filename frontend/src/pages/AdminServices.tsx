import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { api, type ServiceRequest } from '@/lib/api'
import { Utensils, SprayCan, Wrench, ConciergeBell, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AdminServices() {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      const data = await api.getServiceRequests()
      setRequests(data.sort((a: ServiceRequest, b: ServiceRequest) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
    } catch (err) {
      console.error('Failed to load service requests', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await api.updateServiceStatus(id, status)
      loadRequests()
    } catch (err) {
      console.error('Failed to update status', err)
      alert('Error updating status')
    }
  }

  const getIcon = (type: string) => {
    switch(type) {
      case 'room_service': return <Utensils className="w-5 h-5 text-accent" />
      case 'housekeeping': return <SprayCan className="w-5 h-5 text-accent" />
      case 'maintenance': return <Wrench className="w-5 h-5 text-accent" />
      default: return <ConciergeBell className="w-5 h-5 text-accent" />
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4 md:px-6">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-light tracking-wide mb-2">Live Concierge Desk</h1>
            <p className="text-muted-foreground text-sm tracking-wide">Manage remote guest requests via the in-room QR system.</p>
          </div>
          <div className="flex gap-4 text-xs tracking-widest uppercase font-bold text-muted-foreground">
            <span>Pending: <span className="text-yellow-600">{requests.filter(r => r.status === 'pending' && r.is_verified).length}</span></span>
            <span>Active: <span className="text-accent">{requests.filter(r => r.status === 'accepted').length}</span></span>
          </div>
        </header>

        {loading ? (
          <div className="py-20 flex justify-center"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid gap-6">
            {requests.length === 0 && (
              <div className="text-center py-20 text-muted-foreground italic text-sm">No service requests found.</div>
            )}
            {requests.map(req => (
              <div key={req.id} className={`bg-background border p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm transition-colors ${req.status === 'pending' && req.is_verified ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-border hover:border-accent/50'}`}>
                
                <div className="flex flex-col items-center justify-center p-4 bg-secondary min-w-[100px]">
                  {getIcon(req.request_type)}
                  <span className="text-[10px] tracking-widest uppercase mt-2 font-bold">Room {req.room}</span>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-light">{req.request_type_display}</h3>
                    {!req.is_verified ? (
                      <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 border border-muted text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Unverified (No OTP)
                      </span>
                    ) : req.status === 'pending' ? (
                      <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 bg-yellow-500/10 text-yellow-600 font-bold">Needs Action</span>
                    ) : req.status === 'accepted' ? (
                      <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 bg-accent/10 text-accent font-bold">In Progress</span>
                    ) : (
                      <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 bg-green-500/10 text-green-600 font-bold">Completed</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">"{req.description || 'No detailed instructions provided.'}"</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    Guest Email: <span className="font-medium text-foreground">{req.guest_email}</span> • Time: {new Date(req.created_at).toLocaleTimeString()}
                  </p>
                </div>

                <div className="flex flex-col gap-2 min-w-[200px]">
                  {req.is_verified && req.status === 'pending' && (
                    <button onClick={() => handleStatusUpdate(req.id, 'accepted')} className="w-full py-3 bg-accent text-[10px] tracking-widest uppercase text-white hover:bg-accent/90 transition-all font-bold">
                      Accept & Dispatch Team
                    </button>
                  )}
                  {req.status === 'accepted' && (
                    <button onClick={() => handleStatusUpdate(req.id, 'completed')} className="w-full py-3 bg-green-600/10 text-[10px] tracking-widest uppercase text-green-600 border border-green-600/20 hover:bg-green-600 hover:text-white transition-all font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Mark as Closed
                    </button>
                  )}
                  {req.status !== 'cancelled' && req.status !== 'completed' && (
                    <button onClick={() => handleStatusUpdate(req.id, 'cancelled')} className="w-full py-2 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-destructive transition-colors text-center font-bold">
                      Cancel Request
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
