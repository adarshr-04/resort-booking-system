import { useState, useEffect } from 'react'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Sparkles, 
  Coffee, 
  ChevronRight, 
  CreditCard,
  User as UserIcon,
  Home,
  MessageCircle,
  BellRing,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Star
} from 'lucide-react'
import { api, type Booking } from '@/lib/api'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { RoomReviews } from '@/components/booking/RoomReviews'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function GuestDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [serviceRequests, setServiceRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [isItineraryOpen, setIsItineraryOpen] = useState(false)
  const [activeBookingId, setActiveBookingId] = useState<number | null>(null)
  const [requestType, setRequestType] = useState<'housekeeping' | 'supplies' | 'maintenance' | 'concierge' | 'other'>('housekeeping')
  const [requestDescription, setRequestDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null)

  const fetchData = async () => {
    try {
      const data = await api.getMyBookings()
      setBookings(Array.isArray(data) ? data : [])
      
      const active = (Array.isArray(data) ? data : []).find(b => b.status === 'confirmed' || b.status === 'pending')
      if (active) {
        const requests = await api.getServiceRequests()
        // Only show requests for this specific booking
        setServiceRequests(requests.filter((r: any) => r.booking === active.id))
      }
    } catch (error) {
      console.error('Failed to load guest data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000) // Poll for real-time vibe
    return () => clearInterval(interval)
  }, [])

  const activeBooking = bookings.find(b => b.status === 'confirmed' || b.status === 'pending')
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled')

  const openInquiry = (type: typeof requestType, presetMsg: string) => {
    if (!activeBooking) return
    setRequestType(type)
    setRequestDescription(presetMsg)
    setActiveBookingId(activeBooking.id)
    setIsRequestModalOpen(true)
  }

  const handleServiceRequest = async () => {
    if (!activeBookingId) return
    setIsSubmitting(true)
    setSubmitStatus(null)
    try {
      await api.createServiceRequest({
        booking: activeBookingId,
        room: activeBooking?.room,
        request_type: requestType,
        description: requestDescription
      })
      setSubmitStatus('success')
      await fetchData()
      setTimeout(() => {
        setIsRequestModalOpen(false)
        setSubmitStatus(null)
        setRequestDescription('')
      }, 2000)
    } catch (error: any) {
      console.error('Service request failed:', error)
      setErrorMsg(error.message || 'Failed to send request.')
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2EFE6] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#F2EFE6] font-serif">
      <Navbar />

      <div className="container mx-auto px-6 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-16">
            <div className="w-12 h-[1px] bg-accent/40 mb-6" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light italic text-charcoal mb-4">Welcome Home</h1>
            <p className="text-[10px] tracking-[0.3em] uppercase text-accent font-bold">Your Personal Sanctuary Hub</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content: Bookings */}
            <div className="lg:col-span-2 space-y-12">
              
              {/* Active Stay Section */}
              <section>
                <h2 className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground font-bold mb-8 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Current Sanctuary
                </h2>
                
                {activeBooking ? (
                  <div className="bg-white border border-accent/10 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-700">
                    <div className="relative aspect-[21/9] overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop" 
                        alt="Resort" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-6 left-8 text-white">
                        <p className="text-[10px] tracking-widest uppercase mb-1">{activeBooking.room_name}</p>
                        <h3 className="text-2xl italic font-light tracking-wide">{activeBooking.status === 'confirmed' ? 'Stay Confirmed' : 'Awaiting Approval'}</h3>
                      </div>
                    </div>
                    
                    <div className="p-8">
                      <div className="grid md:grid-cols-3 gap-8 mb-10">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2"><Calendar className="w-3 h-3" /> Check-in</span>
                          <p className="text-sm font-medium">{format(new Date(activeBooking.check_in), 'MMMM dd, yyyy')}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2"><Clock className="w-3 h-3" /> Duration</span>
                          <p className="text-sm font-medium">{activeBooking.total_days} Nights</p>
                        </div>
                        <div className="space-y-1 text-right md:text-left">
                          <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2"><CreditCard className="w-3 h-3" /> Total Paid</span>
                          <p className="text-sm font-medium">₹{activeBooking.total_price.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-accent/5">
                        <button 
                          onClick={() => {
                            setActiveBookingId(activeBooking.id)
                            setIsRequestModalOpen(true)
                          }}
                          className="flex-1 bg-accent text-white py-4 text-[10px] tracking-[0.3em] uppercase font-bold hover:bg-accent/90 transition-all flex items-center justify-center gap-3"
                        >
                          <BellRing className="w-4 h-4" /> Guest Concierge Requests
                        </button>
                        <button 
                          onClick={() => setIsItineraryOpen(true)}
                          className="flex-1 border border-charcoal/10 text-charcoal py-4 text-[10px] tracking-[0.3em] uppercase font-bold hover:bg-white transition-all flex items-center justify-center gap-2"
                        >
                          View Journal <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/40 border border-dashed border-accent/20 p-16 text-center">
                    <Home className="w-10 h-10 text-accent/20 mx-auto mb-4" />
                    <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">No active reservations at the moment</p>
                    <button className="mt-6 text-accent text-[10px] font-bold tracking-[0.3em] uppercase border-b border-accent pb-1">Start Your Journey History</button>
                  </div>
                )}

                {activeBooking && serviceRequests.length > 0 && (
                  <div className="mt-12 space-y-4">
                    <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-accent px-2">Live Concierge Activity</h3>
                    <div className="grid gap-3">
                      {serviceRequests.map(req => (
                        <div key={req.id} className="bg-white/60 p-5 border border-accent/5 flex items-center justify-between group hover:bg-white transition-all">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 flex items-center justify-center rounded-full border",
                              req.status === 'resolved' ? "bg-emerald-50 border-emerald-100" : "bg-accent/5 border-accent/10"
                            )}>
                              {req.status === 'resolved' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Clock className="w-5 h-5 text-accent animate-pulse" />}
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal">{req.request_type_display}</p>
                              <p className="text-[9px] text-muted-foreground italic truncate max-w-[200px]">{req.description || 'Service in progress'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[8px] text-muted-foreground font-medium uppercase tracking-widest hidden sm:inline">{format(new Date(req.created_at), 'hh:mm a')}</span>
                            <span className={cn(
                              "text-[8px] font-bold uppercase tracking-widest px-3 py-1 border",
                              req.status === 'resolved' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                            )}>
                              {req.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Past Journeys Section */}
              {pastBookings.length > 0 && (
                <section>
                  <h2 className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground font-bold mb-8">Journey History</h2>
                  <div className="grid gap-4">
                    {pastBookings.map(booking => (
                      <div key={booking.id} className="bg-white/60 p-6 flex items-center justify-between group hover:bg-white transition-all border border-accent/5 shadow-sm">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-accent/5 flex items-center justify-center italic text-lg text-accent/40 font-light">
                            {format(new Date(booking.check_in), 'MMM')}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-charcoal">{booking.room_name}</h4>
                            <p className="text-[10px] text-muted-foreground tracking-widest uppercase">{format(new Date(booking.check_in), 'yyyy')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{booking.status}</p>
                            <p className="text-xs italic font-medium">₹{booking.total_price.toLocaleString()}</p>
                          </div>
                          {booking.status === 'completed' && (
                            <button
                              onClick={() => setReviewBooking(booking)}
                              className="flex items-center gap-2 px-4 py-2 border border-accent/20 text-accent text-[9px] tracking-[0.2em] uppercase font-bold hover:bg-accent hover:text-white transition-all"
                            >
                              <Star className="w-3 h-3" /> Review
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar: Profile & Quick Links */}
            <div className="space-y-8">
              <div className="bg-charcoal p-8 text-white">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6">
                  <UserIcon className="w-8 h-8 text-white/40" />
                </div>
                <h3 className="text-xl italic font-light tracking-wide mb-2">Member Rewards</h3>
                <p className="text-[10px] tracking-[0.2em] uppercase text-accent font-bold mb-4">Elite Gold Status</p>
                <div className="w-full bg-white/10 h-[1px] mb-6" />
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] tracking-widest uppercase text-white/60 font-bold">
                    <span>Nights Spent</span>
                    <span>12</span>
                  </div>
                  <div className="flex justify-between text-[10px] tracking-widest uppercase text-white/60 font-bold">
                    <span>Member ID</span>
                    <span>JW-8821</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 border border-accent/5 shadow-sm space-y-6">
                <h3 className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground font-bold">Quick Inquiries</h3>
                <div className="grid gap-3">
                  {[
                    { type: 'concierge', label: 'Room Upgrade Inquiry', preset: 'I would like to inquire about availability for a room upgrade for my current stay.', icon: <Sparkles className="w-3.5 h-3.5" /> },
                    { type: 'maintenance', label: 'Special Arrangements', preset: 'I have a special request regarding my room setup.', icon: <BellRing className="w-3.5 h-3.5" /> },
                    { type: 'concierge', label: 'Dining Reservations', preset: 'I would like to book a table for dinner at the Chef Garden.', icon: <Coffee className="w-3.5 h-3.5" /> }
                  ].map(item => (
                    <button 
                      key={item.label} 
                      onClick={() => openInquiry(item.type as any, item.preset)}
                      className="w-full p-4 border border-accent/5 hover:border-accent/40 text-left flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-3 py-1">
                        <span className="text-accent">{item.icon}</span>
                        <span className="text-[10px] uppercase tracking-[0.2em] font-medium">{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Itinerary Modal */}
      {isItineraryOpen && activeBooking && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-charcoal/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl p-10 relative animate-in slide-in-from-bottom-4 duration-500 shadow-2xl rounded-none border border-accent/10 overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setIsItineraryOpen(false)}
              className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-charcoal transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-12 border-b border-accent/10 pb-8">
              <h3 className="text-4xl italic font-light text-charcoal mb-2">The Guest Journal</h3>
              <p className="text-[10px] tracking-[0.4em] uppercase text-accent font-bold">RESERVATION RE-{activeBooking.id}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 mb-12">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Sanctuary</h4>
                  <p className="text-lg font-medium">{activeBooking.room_name}</p>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Dates of Resonance</h4>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-accent">Arrival</span>
                      <span>{format(new Date(activeBooking.check_in), 'EEE, MMM dd')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-accent/30 mt-2" />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-accent">Departure</span>
                      <span>{format(new Date(activeBooking.check_out), 'EEE, MMM dd')}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Companions</h4>
                  <p className="text-sm font-medium">{activeBooking.guests} Total Guests</p>
                </div>
              </div>

              <div className="space-y-6 bg-accent/5 p-8 border border-accent/10">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-accent mb-4">Confirmed Experiences</h4>
                {activeBooking.experience_details?.length ? (
                  <ul className="space-y-4">
                    {activeBooking.experience_details.map((exp: any) => (
                      <li key={exp.id} className="flex justify-between items-center text-xs">
                        <span className="font-medium italic">{exp.name}</span>
                        <span className="text-[10px] tracking-tighter uppercase font-bold text-emerald-600">Active</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[10px] italic text-muted-foreground">No additional experiences scheduled yet.</p>
                )}
              </div>
            </div>

            <div className="pt-8 border-t border-accent/10 flex justify-between items-center">
              <div>
                <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Financial State</p>
                <p className="text-2xl font-light italic">₹{activeBooking.total_price.toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setIsItineraryOpen(false)}
                className="px-10 py-4 bg-accent text-white text-[9px] font-bold tracking-[0.3em] uppercase hover:bg-accent/90 transition-all"
              >
                Close Journal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-charcoal/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg relative animate-in zoom-in-95 duration-300 shadow-2xl rounded-none border border-accent/10 text-charcoal overflow-y-auto max-h-[90vh]">
            <div className="p-10 pb-6">
              <button 
                onClick={() => { setIsRequestModalOpen(false); setSubmitStatus(null); setRequestDescription('') }}
                className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-charcoal transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-8">
                <div className="w-12 h-[1px] bg-accent/20 mx-auto mb-4" />
                <h3 className="text-3xl italic font-light">Concierge Assistant</h3>
                <p className="text-[10px] tracking-[0.3em] uppercase text-accent font-bold mt-2">Request an Item or Service</p>
              </div>

              {/* Quick Presets */}
              <div className="mb-8">
                <label className="text-[9px] uppercase tracking-[0.3em] font-bold text-muted-foreground block mb-4">Quick Requests</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {([
                    { type: 'supplies',     label: 'Extra Towels',        desc: 'Please bring extra towels to my room.',         icon: '🛁' },
                    { type: 'housekeeping', label: 'Room Cleaning',        desc: 'Please arrange for room cleaning at your earliest convenience.', icon: '✨' },
                    { type: 'concierge',    label: 'Breakfast in Room',    desc: 'I would like to order breakfast to my room.',   icon: '🍳' },
                    { type: 'supplies',     label: 'Extra Pillows',        desc: 'Could you please send extra pillows to my room?', icon: '🛏️' },
                    { type: 'concierge',    label: 'Late Checkout',        desc: 'I would like to request a late checkout if available.', icon: '🕐' },
                    { type: 'maintenance',  label: 'AC / Temperature',     desc: 'There is an issue with the room temperature / AC.', icon: '❄️' },
                    { type: 'concierge',    label: 'Do Not Disturb',       desc: 'Please do not disturb my room until further notice.', icon: '🚫' },
                    { type: 'concierge',    label: 'Taxi / Transport',     desc: 'I need a taxi or transport arranged. Please call me.', icon: '🚗' },
                  ] as const).map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setRequestType(preset.type)
                        setRequestDescription(preset.desc)
                      }}
                      className={cn(
                        "p-3 border text-left transition-all group hover:border-accent hover:bg-accent/5",
                        requestDescription === preset.desc
                          ? "border-accent bg-accent/5"
                          : "border-accent/10"
                      )}
                    >
                      <span className="text-lg">{preset.icon}</span>
                      <p className="text-[9px] uppercase tracking-widest font-bold text-charcoal group-hover:text-accent transition-colors mt-1">{preset.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[9px] uppercase tracking-[0.3em] font-bold text-muted-foreground block mb-3">Request Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      {id: 'housekeeping', label: 'Cleaning',   icon: <Sparkles className="w-3 h-3" />},
                      {id: 'supplies',     label: 'Supplies',   icon: <Coffee className="w-3 h-3" />},
                      {id: 'maintenance',  label: 'Service',    icon: <BellRing className="w-3 h-3" />},
                      {id: 'concierge',    label: 'Concierge',  icon: <MessageCircle className="w-3 h-3" />}
                    ] as const).map(item => (
                      <button
                        key={item.id}
                        onClick={() => setRequestType(item.id)}
                        className={cn(
                          "p-3 border transition-all text-left flex items-center gap-2",
                          requestType === item.id
                            ? "border-accent bg-accent/5 text-accent shadow-sm"
                            : "border-accent/10 text-muted-foreground hover:bg-white"
                        )}
                      >
                        {item.icon}
                        <span className="text-[9px] uppercase tracking-widest font-bold">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[9px] uppercase tracking-[0.3em] font-bold text-muted-foreground block mb-2">Message for our team</label>
                  <textarea 
                    value={requestDescription}
                    onChange={(e) => setRequestDescription(e.target.value)}
                    placeholder="E.g., Please send two extra towels to my room..."
                    className="w-full bg-[#FAFAFA] border border-accent/10 p-4 text-xs italic focus:outline-none focus:border-accent min-h-[100px] transition-all resize-none"
                  />
                </div>

                {submitStatus === 'success' ? (
                  <div className="p-4 bg-emerald-50 text-emerald-800 text-[10px] tracking-[0.1em] font-bold uppercase text-center flex items-center justify-center gap-2 border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4" /> Our team has been notified. We'll be with you shortly!
                  </div>
                ) : submitStatus === 'error' ? (
                  <div className="p-4 bg-red-50 text-red-800 text-[10px] tracking-[0.1em] font-bold uppercase text-center flex items-center justify-center gap-2 border border-red-100">
                    <AlertCircle className="w-4 h-4" /> {errorMsg || 'Failed to send request. Please try again.'}
                  </div>
                ) : (
                  <button 
                    onClick={handleServiceRequest}
                    disabled={isSubmitting || !requestDescription.trim()}
                    className="w-full bg-accent text-white py-5 text-[10px] tracking-[0.4em] uppercase font-bold hover:bg-accent/90 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Request to Concierge'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-charcoal/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl p-10 relative animate-in zoom-in-95 duration-300 shadow-2xl border border-accent/10 overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setReviewBooking(null)}
              className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-charcoal transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-8">
              <div className="w-12 h-[1px] bg-accent/20 mb-4" />
              <h3 className="text-3xl italic font-light">Rate Your Stay</h3>
              <p className="text-[10px] tracking-[0.3em] uppercase text-accent font-bold mt-1">{reviewBooking.room_name}</p>
            </div>
            <RoomReviews
              roomId={reviewBooking.room}
              roomName={reviewBooking.room_name || 'Your Room'}
              completedBookingId={reviewBooking.id}
            />
          </div>
        </div>
      )}

      <Footer />
    </main>
  )
}
