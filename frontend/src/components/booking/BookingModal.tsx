import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar as CalendarIcon, Users, CreditCard, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { AvailabilityCalendar } from './AvailabilityCalendar'
import { api, type Room, type Experience } from '@/lib/api'
import { cn } from '@/lib/utils'

interface BookingModalProps {
  room: {
    id: number
    name: string
    price_per_night: number
    capacity: number
    extra_bed_price: string
  }
  isOpen: boolean
  onClose: () => void
}

type Step = 'dates' | 'summary' | 'payment' | 'status'

export function BookingModal({ room, isOpen, onClose }: BookingModalProps) {
  const [step, setStep] = useState<Step>('dates')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [guests, setGuests] = useState(1)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [selectedExperiences, setSelectedExperiences] = useState<number[]>([])
  const [bookedRanges, setBookedRanges] = useState<{ check_in: string; check_out: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<{ email: string; first_name: string; last_name: string } | null>(null)
  const [bookingId, setBookingId] = useState<number | null>(null)
  const [bookingStatus, setBookingStatus] = useState<'success' | 'failure' | null>(null)

  // Fetch blocked dates, experiences, and user profile
  useEffect(() => {
    if (isOpen) {
      api.getRoomAvailability(room.id).then(setBookedRanges).catch(console.error)
      api.getExperiences().then(setExperiences).catch(console.error)
      api.getCurrentUser().then((user: any) => setUserData(user)).catch(() => setUserData(null))
    }
  }, [isOpen, room.id])

  const calculateTotal = () => {
    if (!dateRange?.from || !dateRange?.to) return 0
    const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
    const basePrice = days * room.price_per_night
    
    // Extra Bed Price Calculation
    const extraBedPrice = guests > room.capacity ? parseFloat(room.extra_bed_price) * days : 0
    
    const extraPrice = selectedExperiences.reduce((sum, id) => {
      const exp = experiences.find(e => e.id === id)
      return sum + (exp ? parseFloat(exp.price) : 0)
    }, 0)
    return basePrice + extraBedPrice + extraPrice
  }

  const handleNext = () => {
    if (step === 'dates') {
      if (!dateRange?.from || !dateRange?.to) {
        setError('Please select a date range')
        return
      }
      setStep('summary')
    }
  }

  const handleBooking = async () => {
    console.log("Initiating booking flow...");
    setLoading(true)
    setError(null)
    try {
      if (!room.id) throw new Error("Invalid Room selection. Please refresh and try again.");
      if (!dateRange?.from || !dateRange?.to) throw new Error("Check-in and Check-out dates are required.");

      // 1. Create a pending booking
      const bookingData = {
        room: room.id,
        check_in: format(dateRange.from, 'yyyy-MM-dd'),
        check_out: format(dateRange.to, 'yyyy-MM-dd'),
        guests,
        has_extra_bed: guests > (room.capacity || 2),
        experience_ids: selectedExperiences
      }
      
      console.log("Sending booking data:", bookingData);
      const booking = await api.createBooking(bookingData)
      setBookingId(booking.id)
      console.log("Booking created successfully:", booking);
      
      // 2. Initialize Razorpay Payment
      let rzpData;
      try {
        console.log("Initializing payment for booking:", booking.id);
        rzpData = await api.initializePayment(booking.id)
        console.log("Payment initialized:", rzpData);
      } catch (err: any) {
        throw new Error(`Payment initialization failed: ${err.message}. Your reservation has been created but not yet paid.`);
      }

      if (!rzpData?.key_id || rzpData.key_id.includes('test_1234567890')) {
        throw new Error("Payment gateway is temporarily unavailable (Placeholder Key detected). Please contact resort staff.");
      }

      const rzpOptions = {
        key: rzpData.key_id,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: "Coorg Pristine Woods",
        description: `Reservation for ${room.name}`,
        order_id: rzpData.order_id,
        handler: async (response: any) => {
          setLoading(true)
          try {
            await api.verifyPayment(booking.id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
            setBookingStatus('success')
            setStep('status')
          } catch (err: any) {
            setError(err.message || 'Payment verification failed')
            setBookingStatus('failure')
            setStep('status')
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: userData ? `${userData.first_name || ""} ${userData.last_name || ""}`.trim() : "Valued Guest",
          email: userData?.email || "",
        },
        theme: { color: "#1A3C34" },
        modal: {
          ondismiss: () => {
            console.log("Payment window dismissed by user.");
            setLoading(false)
          }
        }
      }
      
      if (!(window as any).Razorpay) {
        throw new Error("Razorpay payment script failed to load. Please disable any ad-blockers or content filters and refresh the page.");
      }

      const rzp = new (window as any).Razorpay(rzpOptions)
      rzp.open()
      
    } catch (err: any) {
      console.error("Booking Error:", err);
      setError(err.message || 'An unexpected error occurred during booking')
      // If it's a critical error, also use a fallback alert to ensure visibility
      if (err.message) {
         window.alert(`Booking Error: ${err.message}`);
      }
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative bg-[#FCF5F5] w-full max-w-xl h-full shadow-2xl flex flex-col"
            >
              <button 
                onClick={onClose} 
                className="absolute top-8 right-8 z-10 w-10 h-10 flex items-center justify-center rounded-full border border-charcoal/10 text-charcoal hover:bg-white/50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex-1 overflow-y-auto px-8 md:px-12 py-16">
                {/* Header Section */}
                <div className="mb-12 text-center">
                  <div className="w-16 h-[1px] bg-accent/30 mx-auto mb-6" />
                  <h2 className="text-4xl font-serif italic tracking-wide text-charcoal mb-2">BOOK Your Stay</h2>
                  <p className="text-[10px] tracking-[0.4em] uppercase text-accent font-bold">{room.name}</p>
                </div>

                {/* Steps Header */}
                <div className="flex gap-1 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                  {(['dates', 'summary', 'status'] as Step[]).map((s) => (
                    <div 
                      key={s}
                      className={cn(
                        "h-1 w-full transition-all duration-500",
                        step === s ? "bg-accent" : "bg-accent/10"
                      )}
                    />
                  ))}
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-6 p-4 bg-red-50 text-red-800 text-xs italic flex items-center gap-2 border border-red-100"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </motion.div>
                )}

                {step === 'dates' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="space-y-4">
                      <div className="flex justify-between items-end border-b border-accent/10 pb-2">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Step 01</span>
                        <span className="text-xs font-serif italic">Select Your Dates</span>
                      </div>
                      <div className="flex justify-center bg-white/40 p-4 rounded-sm border border-white/60">
                        <AvailabilityCalendar 
                          bookedRanges={bookedRanges}
                          selectedRange={dateRange}
                          onRangeSelect={setDateRange}
                          onDateError={setError}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-end border-b border-accent/10 pb-2">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Step 02</span>
                        <span className="text-xs font-serif italic">Guests</span>
                      </div>
                      <div className="flex gap-4 justify-center">
                        {[1, 2, 3, 4].map(n => (
                          <button
                            key={n}
                            onClick={() => {
                              setGuests(n)
                              setError(null)
                            }}
                            className={cn(
                              "w-12 h-12 flex items-center justify-center text-sm transition-all rounded-full border",
                              guests === n 
                                ? "bg-accent text-white border-accent shadow-lg scale-110" 
                                : "border-accent/10 text-muted-foreground hover:bg-white"
                            )}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      
                      {guests > room.capacity && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 p-4 bg-accent/5 border border-accent/10 flex items-start gap-4"
                        >
                          <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[11px] font-bold text-charcoal tracking-wide uppercase">Guest Capacity Note</p>
                            <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                              This room has a standard capacity of {room.capacity} guests. An extra bed will be provided for your comfort at an additional charge of ₹{parseFloat(room.extra_bed_price).toLocaleString()} per night.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <button
                      onClick={handleNext}
                      disabled={!dateRange?.from || !dateRange?.to}
                      className="w-full bg-accent text-white py-5 text-[10px] tracking-[0.4em] uppercase font-bold hover:bg-accent/90 transition-all disabled:opacity-30 flex items-center justify-center gap-2 group"
                    >
                      Continue to Summary 
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                )}

                {step === 'summary' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="space-y-4">
                      <div className="flex justify-between items-end border-b border-accent/10 pb-2">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Step 03</span>
                        <span className="text-xs font-serif italic">Enhance Your Stay</span>
                      </div>
                      <div className="grid gap-3">
                        {experiences.map(exp => (
                          <button
                            key={exp.id}
                            onClick={() => {
                              setSelectedExperiences(prev => 
                                prev.includes(exp.id) ? prev.filter(id => id !== exp.id) : [...prev, exp.id]
                              )
                            }}
                            className={cn(
                              "flex items-center justify-between p-5 border transition-all rounded-sm",
                              selectedExperiences.includes(exp.id) 
                                ? "border-accent bg-white shadow-md ring-1 ring-accent/20" 
                                : "border-accent/5 bg-white/30 hover:bg-white"
                            )}
                          >
                            <div className="text-left">
                              <div className="text-sm font-medium text-charcoal">{exp.name}</div>
                              <div className="text-[10px] text-muted-foreground tracking-widest">{exp.duration}</div>
                            </div>
                            <div className="text-sm font-serif italic">₹{parseFloat(exp.price).toLocaleString()}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/60 p-8 border border-white/80 space-y-4 shadow-sm">
                      <div className="flex justify-between text-xs tracking-wider">
                        <span className="text-muted-foreground uppercase text-[9px] font-bold">Stay Duration</span>
                        <span className="font-serif italic">{Math.ceil((dateRange!.to!.getTime() - dateRange!.from!.getTime()) / (1000 * 60 * 60 * 24))} Nights</span>
                      </div>
                      {selectedExperiences.length > 0 && (
                        <div className="flex justify-between text-xs tracking-wider">
                          <span className="text-muted-foreground uppercase text-[9px] font-bold">Experiences</span>
                          <span className="font-serif italic">₹{selectedExperiences.reduce((sum, id) => sum + parseFloat(experiences.find(e => e.id === id)!.price), 0).toLocaleString()}</span>
                        </div>
                      )}
                      {guests > room.capacity && (
                        <div className="flex justify-between text-xs tracking-wider">
                          <span className="text-muted-foreground uppercase text-[9px] font-bold">Extra Bed</span>
                          <span className="font-serif italic">₹{(parseFloat(room.extra_bed_price) * Math.ceil((dateRange!.to!.getTime() - dateRange!.from!.getTime()) / (1000 * 60 * 60 * 24))).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="pt-4 border-t border-accent/10 flex justify-between items-end">
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Total Amount</span>
                        <span className="text-3xl font-serif italic text-charcoal">₹{calculateTotal().toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => setStep('dates')}
                        className="flex-1 border border-charcoal/10 py-5 text-[10px] tracking-[0.3em] uppercase font-bold hover:bg-white transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleBooking}
                        disabled={loading}
                        className="flex-[2] bg-accent text-white py-5 text-[10px] tracking-[0.4em] uppercase font-bold hover:bg-accent/90 transition-all flex items-center justify-center gap-3 shadow-xl"
                      >
                        {loading ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Processing</>
                        ) : (
                          <><CreditCard className="w-4 h-4" /> Pay & Confirm</>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {step === 'status' && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in duration-500">
                    {bookingStatus === 'success' ? (
                      <>
                        <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mb-4 border border-accent/20">
                          <CheckCircle2 className="w-12 h-12 text-accent" />
                        </div>
                        <h3 className="text-4xl font-serif italic tracking-wide text-charcoal">Exquisite Choice</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm italic">
                          "Your sanctuary at Coorg Pristine Woods is ready. We look forward to welcoming you to the mountains."
                        </p>
                        <div className="pt-4 border-t border-accent/10 w-full max-w-xs mx-auto">
                          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-accent">Booking ID: #{bookingId}</span>
                        </div>
                        <button
                          onClick={onClose}
                          className="px-12 py-4 bg-accent text-white text-[10px] tracking-[0.4em] uppercase font-bold hover:bg-accent/90 transition-all shadow-xl"
                        >
                          Discover More
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
                          <AlertCircle className="w-12 h-12 text-red-800" />
                        </div>
                        <h3 className="text-3xl font-serif italic tracking-wide">A Momentary Delay</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm italic">
                          {error || "We encountered an issue processing your transaction. Please allow us another attempt."}
                        </p>
                        <button
                          onClick={() => setStep('summary')}
                          className="px-12 py-4 border border-charcoal/10 text-[10px] tracking-[0.4em] uppercase font-bold hover:bg-white transition-all shadow-lg"
                        >
                          Retry Payment
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
