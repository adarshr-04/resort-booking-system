import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Hero } from '@/components/sections/Hero'
import { SectionHeader } from '@/components/sections/SectionHeader'
import { FeatureCard } from '@/components/sections/FeatureCard'
import { RoomCard } from '@/components/sections/RoomCard'
import { TestimonialCard } from '@/components/sections/TestimonialCard'
import { Newsletter } from '@/components/sections/Newsletter'
import { MadikeriWidgets } from '@/components/sections/MadikeriWidgets'
import { AmenitiesCards } from '@/components/sections/AmenitiesGrid'
import { api, type Room } from '@/lib/api'

const features = [
  { title: 'Luxurious Accommodations', description: 'Elegantly appointed rooms and suites with breathtaking alpine views', imageSrc: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2070&auto=format&fit=crop', href: '/accommodations' },
  { title: 'Fine Dining', description: 'World-class restaurants and bars serving exquisite cuisine', imageSrc: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop', href: '/dining' },
  { title: 'Spa & Wellness', description: 'Rejuvenating treatments in our award-winning Palace Wellness spa', imageSrc: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070&auto=format&fit=crop', href: '/experiences' },
]

const testimonials = [
  { quote: 'An extraordinary experience that exceeded all expectations. The attention to detail and personalized service is unmatched anywhere in the world.', author: 'Charlotte von Habsburg', location: 'Vienna, Austria' },
  { quote: 'The perfect blend of timeless elegance and modern luxury. Every stay feels like coming home to royalty.', author: 'James Worthington III', location: 'London, UK' },
  { quote: "Simply magical. The views, the service, the cuisine — Coorg Pristine Woods is truly in a league of its own.", author: 'Isabella Rossi', location: 'Milan, Italy' },
]

export default function HomePage() {
  const [featuredRooms, setFeaturedRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFeaturedRooms() {
      try {
        const rooms = await api.getRooms()
        // Filter for featured rooms on frontend (or backend could have a specific endpoint)
        setFeaturedRooms(rooms.filter((r: Room) => r.is_featured).slice(0, 3))
      } catch (error) {
        console.error('Failed to load featured rooms:', error)
      } finally {
        setLoading(false)
      }
    }
    loadFeaturedRooms()
  }, [])

  return (
    <main className="min-h-screen">
      <Navbar />

      <Hero
        title="Immersive, Legendary, Incomparable"
        subtitle="The Pride of Coorg"
        description="A sanctuary of luxury nestled in the lush Western Ghats of India."
        imageSrc="https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?q=80&w=2070&auto=format&fit=crop"
        videoSrc="https://assets.mixkit.co/videos/preview/mixkit-forest-river-in-the-mountains-4245-large.mp4"
        ctaText="Explore Our World"
        ctaHref="/about"
      />

      {/* Weather & Info Bar */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <MadikeriWidgets />
            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm bg-secondary p-4 shadow-sm border border-border">
              <span className="tracking-wider text-muted-foreground"><span className="text-primary font-medium">Summer Season:</span> 5 April – 15 June 2026</span>
              <span className="hidden sm:inline text-border">|</span>
              <span className="tracking-wider text-muted-foreground"><span className="text-primary font-medium">Winter Season:</span> 15 October – 20 February 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* Legacy Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="inline-block text-xs tracking-[0.25em] uppercase text-accent mb-4">Welcome to Our World</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-wide leading-tight mb-6">A Legacy of Excellence</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">Nestled in the heart of Coorg, Coorg Pristine Woods has been the destination of choice for discerning travelers seeking the finest in luxury hospitality.</p>
              <p className="text-muted-foreground leading-relaxed mb-8">From our legendary hospitality to today&apos;s world-renowned service, every moment at the resort is designed to create lasting memories.</p>
              <Link to="/about" className="inline-flex items-center gap-2 text-sm tracking-[0.15em] uppercase hover:text-accent transition-colors">
                Discover Our Story <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="relative group overflow-hidden">
              <div className="aspect-[4/5] bg-cover bg-center transition-transform duration-1000 group-hover:scale-110" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2070&auto=format&fit=crop)' }} />
              <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/10 transition-colors" />
              <div className="absolute -bottom-8 -left-8 bg-accent text-accent-foreground p-8 max-w-xs hidden lg:block shadow-2xl">
                <p className="text-4xl font-light mb-2">127</p>
                <p className="text-sm tracking-wider uppercase">Years of Excellence</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experiences Section */}
      <section className="py-20 lg:py-32 bg-secondary">
        <div className="container mx-auto px-6">
          <SectionHeader eyebrow="Experiences" title="Discover the Palace" description="From world-class dining to rejuvenating spa treatments, explore the many facets of luxury at Coorg Pristine Woods." className="mb-16" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* Hotel Amenities - Ocean Spray Style with Framer Motion */}
      <AmenitiesCards />

      {/* Rooms Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <SectionHeader eyebrow="Accommodations" title="Rooms & Suites" description="Each of our rooms and suites is a sanctuary of comfort, offering stunning views and impeccable attention to detail." className="mb-16" />
          
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredRooms.map((room) => (
                <RoomCard 
                  key={room.id}
                  name={room.name}
                  description={room.description}
                  imageSrc={room.images[0]?.image || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=2074&auto=format&fit=crop'}
                  size={`${room.capacity} Guests`}
                  capacity={`${room.price_per_night} / night`}
                  href={`/contact?room=${room.id}`}
                />
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link to="/accommodations" className="inline-block px-10 py-4 bg-primary text-primary-foreground text-sm tracking-[0.15em] uppercase hover:bg-accent hover:text-accent-foreground transition-colors">
              View All Accommodations
            </Link>
          </div>
        </div>
      </section>

      <section className="relative py-32 lg:py-48 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop)' }} />
        <div className="absolute inset-0 bg-primary/40" />
        <div className="relative z-10 container mx-auto px-6 text-center text-white">
          <span className="inline-block text-xs tracking-[0.25em] uppercase text-white/70 mb-4">Unforgettable Moments</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-wide mb-6 max-w-3xl mx-auto">Create Memories That Last a Lifetime</h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">Whether celebrating a milestone, hosting an event, or simply indulging in the art of relaxation, Coorg Pristine Woods offers the perfect setting.</p>
          <button 
            onClick={() => {
              const token = localStorage.getItem('access_token')
              if (token) {
                window.location.href = '/contact'
              } else {
                window.location.href = '/login'
              }
            }}
            className="inline-block px-10 py-4 border border-white text-white text-sm tracking-[0.15em] uppercase hover:bg-white hover:text-primary transition-all"
          >
            Plan Your Stay
          </button>
        </div>
      </section>

      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <SectionHeader eyebrow="Guest Experiences" title="What Our Guests Say" description="Discover why discerning travelers from around the world choose Coorg Pristine Woods for their alpine escape." className="mb-16" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((t) => <TestimonialCard key={t.author} {...t} />)}
          </div>
        </div>
      </section>

      <Newsletter />
      <Footer />
    </main>
  )
}
