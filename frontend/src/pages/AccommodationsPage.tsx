import { useState, useEffect } from 'react'
import { Check, Star } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Hero } from '@/components/sections/Hero'
import { SectionHeader } from '@/components/sections/SectionHeader'
import { RoomCard } from '@/components/sections/RoomCard'
import { BookingModal } from '@/components/booking/BookingModal'
import { Newsletter } from '@/components/sections/Newsletter'
import { api, type Room, type Review } from '@/lib/api'

const amenities = ['Complimentary high-speed WiFi', 'In-room Nespresso machine', 'Premium bath amenities', 'Plush bathrobes and slippers', '24-hour room service', 'Twice-daily housekeeping', 'Turndown service', 'Pillow menu', 'In-room safe', 'Mini bar', 'Smart TV with streaming', 'Climate control']

export default function AccommodationsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])

  const totalCapacity = rooms.reduce((sum, r) => sum + (r.total_inventory || 1), 0)

  useEffect(() => {
    async function loadData() {
      try {
        const [roomData, reviewData] = await Promise.all([
          api.getRooms(),
          api.getReviews()
        ])
        setRooms(roomData)
        setReviews(reviewData)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleBookNow = (room: Room) => {
    setSelectedRoom(room)
    setIsModalOpen(true)
  }

  const amenities = [
    "Personal Butler Service",
    "Private Balcony with Alps View",
    "Heated Marbel Floors",
    "Smart Scene Lighting",
    "En-suite Spa Bath",
    "Nespresso Ritual Kit"
  ]

  return (
    <main className="min-h-screen bg-background font-serif">
      <Navbar />
      
      <Hero 
        title="Your Sanctuary Awaits" 
        subtitle="Select the perfect backdrop for your alpine memories."
        imageSrc="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop"
        showScrollIndicator={false} 
      />

      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <span className="inline-block text-xs tracking-[0.25em] uppercase text-accent mb-4">Accommodations</span>
              <h1 className="text-4xl md:text-5xl font-light tracking-wide mb-6 text-foreground">Where Luxury Meets Comfort</h1>
              <p className="text-muted-foreground leading-relaxed italic">Our selection of rooms and suites combine timeless elegance with modern comfort. Each space has been thoughtfully designed to provide the ultimate alpine retreat.</p>
            </div>
            
            <div className="bg-secondary/50 border border-border px-8 py-6 text-center min-w-[200px] animate-in fade-in slide-in-from-right-4 duration-700">
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1 font-bold">Resort Capacity</p>
              <div className="text-3xl font-light text-accent">
                {loading ? '--' : totalCapacity}
              </div>
              <p className="text-[9px] tracking-widest uppercase text-muted-foreground mt-1">Exquisite Units Available</p>
            </div>
          </div>
        </div>
      </section>

      <section id="room-grid" className="py-12 lg:py-20 bg-secondary">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rooms.map((room) => (
                <RoomCard 
                  key={room.id}
                  room={room}
                  units={room.total_inventory}
                  onBookNow={handleBookNow}
                />
              ))}
              {rooms.length === 0 && (
                <div className="col-span-full text-center py-20 text-muted-foreground">
                  No rooms available at the moment.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block text-xs tracking-[0.25em] uppercase text-accent mb-4">In-Room Amenities</span>
              <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-6">Every Comfort Considered</h2>
              <p className="text-muted-foreground leading-relaxed mb-8">From the moment you enter your room, every detail has been carefully curated to ensure your comfort.</p>
              <div className="grid grid-cols-2 gap-4">
                {amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent flex-shrink-0" /><span className="text-sm">{a}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=2074&auto=format&fit=crop)' }} />
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-32 bg-secondary/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center mb-16 text-center">
            <span className="text-xs tracking-[0.25em] uppercase text-accent mb-4 italic">Guest Experience</span>
            <h2 className="text-3xl md:text-5xl font-light tracking-wide mb-8">What Our Guests Say</h2>
          </div>
          
          {reviews.length === 0 ? (
            <p className="text-center text-sm italic text-muted-foreground py-10">
              Be the first to share your experience after your stay.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reviews.slice(0, 6).map((review) => (
                <div key={review.id} className="bg-background border border-border p-10 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${ s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-sm italic leading-relaxed text-muted-foreground mb-6 flex-1">"{review.comment}"</p>
                  <div className="border-t border-border pt-4">
                    <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-accent">{review.user_name}</span>
                    <p className="text-[9px] text-muted-foreground tracking-widest mt-0.5">{review.room_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedRoom && (
        <BookingModal 
          room={selectedRoom}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <Newsletter />
      <Footer />
    </main>
  )
}
