import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Calendar, Info } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Hero } from '@/components/sections/Hero'
import { api, type Room, type Experience } from '@/lib/api'
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar'
import { DateRange } from 'react-day-picker'
import { format, differenceInDays } from 'date-fns'
import { Plus, Check as CheckIcon } from 'lucide-react'

export default function ContactPage() {
  const [searchParams] = useSearchParams()
  const roomId = searchParams.get('room')
  
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [bookedRanges, setBookedRanges] = useState<{check_in: string; check_out: string}[]>([])
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>()
  
  // E-commerce Checkout State
  const [step, setStep] = useState(1)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [selectedExperiences, setSelectedExperiences] = useState<number[]>([])

  const [form, setForm] = useState({ guests: '2', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (roomId) {
      async function loadRoomDetails() {
        try {
          const [room, availability, exps] = await Promise.all([
            api.getRoom(parseInt(roomId as string)),
            api.getRoomAvailability(parseInt(roomId as string)),
            api.getExperiences()
          ])
          setSelectedRoom(room)
          setBookedRanges(availability)
          setExperiences(exps)
        } catch (err) {
          console.error('Failed to load room details:', err)
        }
      }
      loadRoomDetails()
    }
  }, [roomId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!selectedRange?.from || !selectedRange?.to) {
      setError('Please select your arrival and departure dates on the calendar.')
      return
    }

    const token = localStorage.getItem('access_token')
    if (!token) {
      setError('You must be signed in to book a room.')
      return
    }

    setLoading(true)
    try {
      await api.createBooking({
        room: parseInt(roomId!),
        check_in: format(selectedRange.from, 'yyyy-MM-dd'),
        check_out: format(selectedRange.to, 'yyyy-MM-dd'),
        guests: parseInt(form.guests),
        experience_ids: selectedExperiences
      })
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Failed to create booking. Please check your dates.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero 
        title={selectedRoom ? `Booking: ${selectedRoom.name}` : "Contact & Reservations"} 
        subtitle="We Are Here For You" 
        description={selectedRoom ? "Confirm your dates and guests to finalize your stay at Coorg Pristine Woods." : "Our dedicated team is available 24 hours a day, 7 days a week to assist with your reservation."}
        imageSrc={selectedRoom?.images[0]?.image || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop"} 
        height="large" 
        showScrollIndicator={false} 
      />

      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Info / Selected Room */}
            <div className="space-y-12">
              {selectedRoom ? (
                <div className="bg-secondary p-8 border border-border">
                  <span className="inline-block text-xs tracking-[0.25em] uppercase text-accent mb-4">Your Selection</span>
                  <h2 className="text-3xl font-light tracking-wide mb-6">{selectedRoom.name}</h2>
                  <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
                    <p>{selectedRoom.description}</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-border mt-6">
                      <div className="w-10 h-10 bg-background flex items-center justify-center">
                        <Info className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{selectedRoom.capacity} Guests Max</p>
                        <p className="text-xs uppercase tracking-wider">₹ {selectedRoom.price_per_night} / Nightly Rate</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-12">
                  <div>
                    <span className="inline-block text-xs tracking-[0.25em] uppercase text-accent mb-4">Get In Touch</span>
                    <h2 className="text-3xl font-light tracking-wide mb-8">Reservations & Enquiries</h2>
                    <div className="space-y-6">
                      {[
                        { Icon: MapPin, label: 'Address', value: 'Madikeri - Virajpet Rd, Coorg, Karnataka, India' },
                        { Icon: Phone, label: 'Telephone', value: '+41 81 837 1100' },
                        { Icon: Mail, label: 'Email', value: 'reservations@pristinewoods.com' },
                      ].map(({ Icon, label, value }) => (
                        <div key={label} className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-secondary flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-medium tracking-wider uppercase mb-1">{label}</p>
                            <p className="text-muted-foreground">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-8 pt-8 border-t border-border">
                      <span className="inline-block text-xs tracking-[0.25em] uppercase text-accent mb-4">Airport Distances</span>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                          <span className="font-medium">Mangaluru Int. Airport (IXE)</span>
                          <span className="text-muted-foreground">Approx. 140 km</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">Bengaluru Int. Airport (BLR)</span>
                          <span className="text-muted-foreground">Approx. 290 km</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedRoom && (
                <div className="bg-background border border-border p-8">
                  <h4 className="text-[10px] tracking-[0.2em] uppercase text-accent mb-6 font-bold">Select Your Stay Period</h4>
                  <AvailabilityCalendar 
                    bookedRanges={bookedRanges}
                    selectedRange={selectedRange}
                    onRangeSelect={setSelectedRange}
                    onDateError={(err) => setError(err || '')}
                  />
                  <p className="mt-6 text-[10px] text-muted-foreground italic leading-relaxed">
                    Note: Dates marked as "Sold Out" are unavailable. Same-day check-in/out transitions are supported.
                  </p>
                </div>
              )}
            </div>

            {/* Form */}
            <div>
              {submitted ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-12 bg-accent/5 border border-accent/20">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Calendar className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="text-2xl font-light mb-4">Booking Request Sent</h3>
                    <p className="text-muted-foreground mb-8">Thank you for your request. Our reservations team will review your booking and contact you shortly.</p>
                    <Link to="/" className="text-xs tracking-widest uppercase text-accent border-b border-accent pb-1">Return Home</Link>
                  </div>
                </div>
              ) : (
                <div className="bg-background p-8 lg:p-12 border border-border sticky top-32">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-light italic">Finalize Reservation</h3>
                    <div className="text-xs text-muted-foreground tracking-widest uppercase">Step {step} of 3</div>
                  </div>
                  
                  {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-4 mb-6 border border-destructive/20 text-center animate-in fade-in slide-in-from-top-2">
                      {error}
                      {error.includes('signed in') && (
                        <div className="mt-2 text-xs">
                          <Link to="/login" className="underline font-bold">Sign In Here</Link>
                        </div>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {step === 1 && (
                      <div className="animate-in fade-in slide-in-from-bottom-2">
                        <div className="p-4 bg-secondary/30 border border-border mb-6">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] tracking-widest uppercase text-muted-foreground">Stay Dates</span>
                          </div>
                          <div className="text-sm font-medium">
                            {selectedRange?.from ? (
                              <>
                                {format(selectedRange.from, 'PPP')}
                                {selectedRange.to && ` — ${format(selectedRange.to, 'PPP')}`}
                              </>
                            ) : (
                              <span className="text-muted-foreground italic">Highlight range on calendar</span>
                            )}
                          </div>
                        </div>

                        <div className="mb-6">
                          <label className="block text-xs tracking-wider uppercase mb-2">Number of Guests</label>
                          <select name="guests" value={form.guests} onChange={handleChange} className="w-full px-4 py-3 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent">
                            {['1','2','3','4','5','6+'].map((n) => <option key={n} value={n}>{n} Guest{n !== '1' ? 's' : ''}</option>)}
                          </select>
                        </div>
                        <div className="mb-6">
                          <label className="block text-xs tracking-wider uppercase mb-2">Special Requests (Optional)</label>
                          <textarea name="message" value={form.message} onChange={handleChange} rows={2} className="w-full px-4 py-3 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent resize-none" placeholder="Any special requirements..." />
                        </div>
                        
                        <button 
                          type="button" 
                          onClick={() => {
                            if (!selectedRange?.from || !selectedRange?.to) {
                              setError("Please select dates first.");
                              return;
                            }
                            setError(""); setStep(2);
                          }}
                          disabled={!roomId || !selectedRange?.to}
                          className="w-full py-4 bg-primary text-primary-foreground text-sm tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          Next: Enhance Your Stay
                        </button>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="animate-in fade-in slide-in-from-right-4">
                        <p className="text-sm text-muted-foreground mb-4">Elevate your experience with our luxury add-ons.</p>
                        <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2">
                          {experiences.map(exp => {
                            const isSelected = selectedExperiences.includes(exp.id);
                            return (
                              <div 
                                key={exp.id} 
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedExperiences(prev => prev.filter(id => id !== exp.id))
                                  } else {
                                    setSelectedExperiences(prev => [...prev, exp.id])
                                  }
                                }}
                                className={`p-4 border cursor-pointer transition-all ${isSelected ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'}`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex gap-3">
                                    <div className={`w-5 h-5 mt-0.5 border flex items-center justify-center ${isSelected ? 'bg-accent border-accent' : 'border-muted-foreground/50'}`}>
                                      {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-bold text-foreground">{exp.name}</h4>
                                      <p className="text-xs text-muted-foreground mt-1">{exp.description.substring(0, 50)}...</p>
                                    </div>
                                  </div>
                                  <span className="text-sm text-accent whitespace-nowrap ml-2">₹ {exp.price}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <div className="flex gap-4">
                          <button type="button" onClick={() => setStep(1)} className="w-1/3 py-4 border border-border text-sm tracking-widest uppercase hover:bg-secondary transition-colors">Back</button>
                          <button type="button" onClick={() => setStep(3)} className="w-2/3 py-4 bg-primary text-primary-foreground text-sm tracking-widest uppercase hover:bg-primary/90 transition-colors">Review Total</button>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="animate-in fade-in slide-in-from-right-4">
                        <div className="bg-secondary/30 border border-border p-5 mb-6 space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Room Base Rate (Nightly)</span>
                            <span>₹ {selectedRoom?.price_per_night}</span>
                          </div>
                          
                          {selectedRange?.from && selectedRange?.to && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Duration</span>
                              <span>{differenceInDays(selectedRange.to, selectedRange.from)} Nights</span>
                            </div>
                          )}

                          <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                            <span className="text-muted-foreground">Room Subtotal</span>
                            <span>₹ {selectedRoom?.price_per_night && selectedRange?.from && selectedRange?.to ? (selectedRoom.price_per_night * differenceInDays(selectedRange.to, selectedRange.from)) : 0}</span>
                          </div>

                          {selectedExperiences.length > 0 && (
                            <div className="pt-2 border-t border-border/50">
                              <span className="text-xs tracking-widest uppercase text-muted-foreground block mb-2">Experiences Add-ons</span>
                              {experiences.filter(e => selectedExperiences.includes(e.id)).map(e => (
                                <div key={e.id} className="flex justify-between text-sm text-muted-foreground mb-1">
                                  <span>+ {e.name}</span>
                                  <span>₹ {e.price}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center pt-4 border-t border-border mt-2">
                            <span className="text-xl font-light tracking-widest uppercase">Grand Total</span>
                            <span className="text-2xl text-accent font-light">
                              ₹ {
                                ((selectedRoom?.price_per_night || 0) * (selectedRange?.from && selectedRange?.to ? differenceInDays(selectedRange.to, selectedRange.from) : 0)) +
                                experiences.filter(e => selectedExperiences.includes(e.id)).reduce((acc, curr) => acc + parseFloat(curr.price), 0)
                              }
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <button type="button" onClick={() => setStep(2)} className="w-1/3 py-4 border border-border text-sm tracking-widest uppercase hover:bg-secondary transition-colors" disabled={loading}>Back</button>
                          <button type="submit" disabled={loading} className="w-2/3 py-4 bg-primary text-primary-foreground text-sm tracking-widest uppercase hover:bg-primary/90 transition-colors">
                            {loading ? 'Processing...' : 'Confirm Book'}
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              )}
          </div>
        </div>
      </div>
    </section>

      <Footer />
    </main>
  )
}
