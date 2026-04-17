import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, type Room, type Experience } from '@/lib/api'
import { Utensils, SprayCan, Wrench, ConciergeBell, CheckCircle2, ChevronLeft, Sparkles, Clock, IndianRupee } from 'lucide-react'

export default function RoomServicePortal() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState<Room | null>(null)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null)
  
  const [step, setStep] = useState(1)
  const [requestType, setRequestType] = useState('room_service')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [requestId, setRequestId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (roomId) {
      api.getRoom(Number(roomId)).then(setRoom).catch(() => setError('Room not found'))
      api.getExperiences().then(setExperiences).catch(() => console.error('Failed to load experiences'))
    }
  }, [roomId])

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.createServiceRequest({
        room: Number(roomId),
        request_type: requestType,
        experience: selectedExperience?.id,
        description: selectedExperience ? `Booking for ${selectedExperience.name}. ${description}` : description,
        guest_email: email
      })
      setRequestId(res.id)
      setStep(2) // Move to OTP step
    } catch (err: any) {
      setError(err.message || 'Failed to submit request')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestId) return
    setLoading(true)
    setError('')
    try {
      await api.verifyServiceOtp(requestId, otp)
      setStep(3) // Success
    } catch (err: any) {
      setError(err.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  if (!room) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">Loading Room Data...</div>
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col">
      <header className="bg-primary text-primary-foreground p-6 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-xl font-light tracking-widest uppercase">Digital Concierge</h1>
          <p className="text-xs text-primary-foreground/70">Room {room.name}</p>
        </div>
        <ConciergeBell className="w-8 h-8 opacity-80" />
      </header>

      <main className="flex-1 p-6 max-w-md w-full mx-auto">
        {error && <div className="bg-destructive/10 text-destructive border border-destructive p-3 text-xs mb-6 rounded">{error}</div>}

        {step === 1 && (
          <form onSubmit={handleCreateRequest} className="space-y-6">
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-muted-foreground mb-3 font-bold">Select Service</label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'room_service', icon: Utensils, label: 'Dining' },
                  { id: 'housekeeping', icon: SprayCan, label: 'Housekeeping' },
                  { id: 'experience', icon: Sparkles, label: 'Luxury Experiences' },
                  { id: 'maintenance', icon: Wrench, label: 'Maintenance' },
                  { id: 'other', icon: ConciergeBell, label: 'Other' },
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setRequestType(type.id)}
                    className={`p-4 flex flex-col items-center gap-2 border transition-all ${requestType === type.id ? 'border-accent bg-accent/5 text-accent' : 'border-border bg-background hover:border-accent/50'}`}
                  >
                    <type.icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {requestType === 'experience' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <label className="block text-[10px] tracking-widest uppercase text-muted-foreground font-bold">Recommended for You</label>
                <div className="grid grid-cols-1 gap-4">
                  {experiences.map(exp => (
                    <div 
                      key={exp.id}
                      onClick={() => setSelectedExperience(exp)}
                      className={`group cursor-pointer border overflow-hidden transition-all ${selectedExperience?.id === exp.id ? 'border-accent ring-1 ring-accent' : 'border-border bg-background'}`}
                    >
                      <div className="aspect-[21/9] overflow-hidden">
                        <img src={exp.image_url} alt={exp.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-sm font-semibold">{exp.name}</h3>
                          <span className="text-accent text-sm font-bold">₹{exp.price}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed mb-3 line-clamp-2">{exp.description}</p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground border-t pt-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {exp.duration}
                          </div>
                          <div className="flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" /> Per Person
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Request Details</label>
              <textarea 
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g., Extra towels, Breakfast order..."
                className="w-full p-4 bg-background border border-border text-xs focus:ring-1 focus:ring-accent outline-none min-h-[100px]"
              />
            </div>

            <div>
              <label className="block text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Verify Guest Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your registered email address"
                className="w-full p-4 bg-background border border-border text-xs focus:ring-1 focus:ring-accent outline-none"
              />
            </div>

            <button 
              disabled={loading}
              type="submit" 
              className="w-full bg-accent text-white py-4 text-xs tracking-widest uppercase font-bold hover:bg-accent/90 transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Request Service'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6 bg-background p-8 border border-border">
            <div className="text-center mb-8">
              <h2 className="text-xl font-light mb-2">Verification Required</h2>
              <p className="text-xs text-muted-foreground">For security, please enter the 6-digit code sent to <strong>{email}</strong>.</p>
            </div>
            
            <input 
              type="text" 
              required
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="000000"
              className="w-full p-4 text-center tracking-[0.5em] text-2xl bg-secondary/50 border border-border focus:ring-1 focus:ring-accent outline-none"
            />

            <button 
              disabled={loading}
              type="submit" 
              className="w-full bg-primary text-primary-foreground py-4 text-xs tracking-widest uppercase font-bold hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Confirm Request'}
            </button>

            <button type="button" onClick={() => setStep(1)} className="w-full text-center text-xs text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1">
              <ChevronLeft className="w-3 h-3" /> Go Back
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center py-12 bg-background border border-border px-6">
            <CheckCircle2 className="w-16 h-16 text-accent mx-auto mb-6" />
            <h2 className="text-2xl font-light tracking-wide mb-2">Request Received</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Our {requestType.replace('_', ' ')} team has been notified. We will attend to Room {room.name} shortly.
            </p>
            <button onClick={() => setStep(1)} className="mt-8 border-b-2 border-accent text-xs tracking-widest uppercase font-bold pb-1 text-accent">
              Make Another Request
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
