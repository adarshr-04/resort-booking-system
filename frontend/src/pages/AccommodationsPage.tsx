import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Hero } from '@/components/sections/Hero'
import { SectionHeader } from '@/components/sections/SectionHeader'
import { RoomCard } from '@/components/sections/RoomCard'
import { Newsletter } from '@/components/sections/Newsletter'
import { api, type Room } from '@/lib/api'

const amenities = ['Complimentary high-speed WiFi', 'In-room Nespresso machine', 'Premium bath amenities', 'Plush bathrobes and slippers', '24-hour room service', 'Twice-daily housekeeping', 'Turndown service', 'Pillow menu', 'In-room safe', 'Mini bar', 'Smart TV with streaming', 'Climate control']

export default function AccommodationsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  const groupedRooms = rooms.reduce((acc, room) => {
    // Group by base name: "Palace Suite #1" -> "Palace Suite"
    const typeName = room.name.includes('#') ? room.name.split(' #')[0] : room.name
    if (!acc[typeName]) {
      acc[typeName] = { ...room, name: typeName, count: 0 }
    }
    acc[typeName].count += 1
    return acc
  }, {} as Record<string, Room & { count: number }>)

  const displayRooms = Object.values(groupedRooms)

  useEffect(() => {
    async function loadRooms() {
      try {
        const data = await api.getRooms()
        setRooms(data)
      } catch (error) {
        console.error('Failed to load rooms:', error)
      } finally {
        setLoading(false)
      }
    }
    loadRooms()
  }, [])

  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero 
        title="Rooms & Suites" 
        subtitle="Your Alpine Sanctuary" 
        description="Each accommodation is a masterpiece of Swiss craftsmanship, offering unparalleled comfort and breathtaking views" 
        imageSrc="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2070&auto=format&fit=crop" 
        height="large" 
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
                {loading ? '--' : rooms.length}
              </div>
              <p className="text-[9px] tracking-widest uppercase text-muted-foreground mt-1">Exquisite Suites Available</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-20 bg-secondary">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayRooms.map((room) => (
                <RoomCard 
                  key={room.id}
                  name={room.name}
                  description={room.description}
                  imageSrc={room.images[0]?.image || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=2074&auto=format&fit=crop'}
                  size={`${room.capacity} Guests`}
                  capacity={`${room.price_per_night} / night`}
                  href={`/contact?room=${room.id}`}
                  units={room.count}
                />
              ))}
              {displayRooms.length === 0 && (
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
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { text: "Absolutely breathtaking views of the Alps. The service was impeccable.", author: "Royal GuestRef #101" },
              { text: "A truly royal experience. The personal butler was a nice touch.", author: "Alpine Traveler" },
              { text: "The most breakfast selection I've ever seen. Can't wait to return!", author: "Summer Visitor" }
            ].map((review, i) => (
              <div key={i} className="bg-background border border-border p-10 flex flex-col items-center text-center shadow-sm">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-accent text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm italic leading-relaxed text-muted-foreground mb-8">"{review.text}"</p>
                <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-accent">{review.author}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Newsletter />
      <Footer />
    </main>
  )
}
