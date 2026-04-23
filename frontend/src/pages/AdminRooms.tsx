import { useState, useEffect, useRef } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { api, type Room } from '@/lib/api'
import { Bed, Users, Eye, Plus, Edit2, X, QrCode, Download, Printer } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'

export default function AdminRooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [qrRoom, setQrRoom] = useState<Room | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_per_night: '',
    price_per_day: '',
    capacity: '2',
    is_available: true
  })

  // Use the local network IP so QR codes work when scanned from phones
  const servicePortalUrl = (roomId: number) => {
    const host = window.location.host // e.g. 127.0.0.1:8000 or 192.168.109.173:8000
    return `http://${host}/room-service/${roomId}`
  }

  async function loadRooms() {
    setLoading(true)
    try {
      const data = await api.getRooms()
      setRooms(data)
    } catch (err) {
      console.error('Failed to load rooms:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRooms()
  }, [])

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.createRoom({
        ...formData,
        price_per_night: parseFloat(formData.price_per_night),
        price_per_day: parseFloat(formData.price_per_day),
        capacity: parseInt(formData.capacity)
      })
      setIsAdding(false)
      loadRooms()
    } catch (err) {
      console.error('Failed to add room:', err)
    }
  }

  const handleDownloadQR = () => {
    if (!qrRoom) return
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = url
    link.download = `QR-Room-${qrRoom.name.replace(/\s+/g, '-')}.png`
    link.click()
  }

  const handlePrintQR = () => {
    if (!qrRoom) return
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>QR Code — ${qrRoom.name}</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#fafafa;gap:16px;">
        <h1 style="font-size:14px;letter-spacing:4px;text-transform:uppercase;color:#333;">${qrRoom.name}</h1>
        <img src="${dataUrl}" style="width:220px;height:220px;" />
        <p style="font-size:11px;color:#888;letter-spacing:2px;text-transform:uppercase;">Scan to Request Room Service</p>
        <p style="font-size:9px;color:#bbb;">Coorg Pristine Woods</p>
        <script>window.onload=()=>{window.print();window.close()}<\/script>
      </body></html>
    `)
    win.document.close()
  }

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4 md:px-6">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-light tracking-wide mb-2">Room Inventory</h1>
            <p className="text-muted-foreground text-sm tracking-wide">Manage room availability, pricing, amenities and QR codes.</p>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-xs tracking-[0.2em] uppercase hover:bg-primary/90 transition-all font-bold"
          >
            <Plus className="w-4 h-4" />
            Add New Room
          </button>
        </header>

        {/* Add Room Modal */}
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setIsAdding(false)} />
            <div className="relative w-full max-w-2xl bg-background border border-border shadow-2xl animate-in fade-in zoom-in-95 duration-300">
              <header className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-light tracking-wide uppercase">Configure New Room</h2>
                <button onClick={() => setIsAdding(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </header>
              <form onSubmit={handleAddRoom} className="p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] tracking-widest uppercase text-muted-foreground font-bold">Room Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-secondary/30 border border-border p-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent" placeholder="e.g. Forest Suite #3" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] tracking-widest uppercase text-muted-foreground font-bold">Max Capacity</label>
                    <input required type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="w-full bg-secondary/30 border border-border p-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] tracking-widest uppercase text-muted-foreground font-bold">Description</label>
                  <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-secondary/30 border border-border p-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent h-24" placeholder="Detailed room features..." />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] tracking-widest uppercase text-muted-foreground font-bold">Price per Night (₹)</label>
                    <input required type="number" value={formData.price_per_night} onChange={e => setFormData({...formData, price_per_night: e.target.value})} className="w-full bg-secondary/30 border border-border p-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] tracking-widest uppercase text-muted-foreground font-bold">Price per Day (₹)</label>
                    <input required type="number" value={formData.price_per_day} onChange={e => setFormData({...formData, price_per_day: e.target.value})} className="w-full bg-secondary/30 border border-border p-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
                  </div>
                </div>
                <div className="pt-6 flex justify-end gap-4">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-8 py-3 text-[10px] tracking-widest uppercase hover:bg-secondary transition-all">Cancel</button>
                  <button type="submit" className="px-10 py-3 bg-accent text-accent-foreground text-[10px] tracking-widest uppercase font-bold hover:opacity-90 transition-all">Create Room</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {qrRoom && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={() => setQrRoom(null)} />
            <div className="relative w-full max-w-sm bg-background border border-border shadow-2xl animate-in fade-in zoom-in-95 duration-300">
              <header className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-light tracking-wide">Room QR Code</h2>
                  <p className="text-xs text-accent tracking-widest uppercase mt-0.5">{qrRoom.name}</p>
                </div>
                <button onClick={() => setQrRoom(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="p-8 flex flex-col items-center gap-6">
                <div ref={qrRef} className="p-4 bg-white border border-border">
                  <QRCodeCanvas
                    value={servicePortalUrl(qrRoom.id)}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#1a2e1a"
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Guests scan this to request room service</p>
                  <p className="text-[10px] text-muted-foreground/60 font-mono break-all">{servicePortalUrl(qrRoom.id)}</p>
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={handleDownloadQR}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-border text-xs tracking-widest uppercase hover:bg-secondary transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button
                    onClick={handlePrintQR}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground text-xs tracking-widest uppercase hover:bg-primary/90 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-full py-20 flex justify-center">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            rooms.map((room) => (
              <div key={room.id} className="bg-background border border-border group hover:border-accent transition-all duration-500 overflow-hidden">
                <div className="aspect-video relative overflow-hidden bg-secondary">
                  {room.images?.[0] ? (
                    <img src={room.images[0].image} alt={room.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Bed className="w-8 h-8 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <span className={`text-[9px] px-2 py-1 tracking-widest uppercase font-bold ${
                      room.is_available ? "bg-accent text-accent-foreground" : "bg-destructive text-destructive-foreground"
                    }`}>
                      {room.is_available ? 'Active' : 'Out of Order'}
                    </span>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-light tracking-wide">{room.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setQrRoom(room)}
                        title="View QR Code"
                        className="p-2 text-muted-foreground hover:text-accent transition-colors"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-muted-foreground hover:text-accent transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-6 line-clamp-2 h-8">{room.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-8 text-[10px] tracking-widest uppercase text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      {room.capacity} Guests
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-3 h-3" />
                      Forest View
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border flex items-center justify-between">
                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Nightly Rate</p>
                      <p className="text-lg font-light">₹ {Number(room.price_per_night).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => setQrRoom(room)}
                      className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-accent font-bold hover:underline"
                    >
                      <QrCode className="w-3 h-3" />
                      QR Code
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
