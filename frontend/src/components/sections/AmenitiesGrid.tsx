import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

interface AmenityCard {
  id: number
  title: string
  image: string
  overlayColor: string
}

const amenities: AmenityCard[] = [
  {
    id: 1,
    title: 'One Of The Largest Swimming Pool',
    image: 'https://images.unsplash.com/photo-1601918774946-25832a4be0d6?auto=format&fit=crop&q=80&w=1200',
    overlayColor: 'rgba(26, 60, 52, 0.85)', // Deep Green
  },
  {
    id: 2,
    title: 'Floating Restaurant',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=1200',
    overlayColor: 'rgba(164, 216, 225, 0.72)', // Sky Blue
  },
  {
    id: 3,
    title: 'Ayurvedic Spa',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1200',
    overlayColor: 'rgba(26, 60, 52, 0.75)', // Deep Green
  },
  {
    id: 4,
    title: 'Travel Desk',
    image: 'https://images.unsplash.com/photo-1530538987395-032d1800fdd4?auto=format&fit=crop&q=80&w=1200',
    overlayColor: 'rgba(164, 216, 225, 0.65)', // Sky Blue
  },
  {
    id: 5,
    title: 'Adventure Activities',
    image: 'https://images.unsplash.com/photo-1465188162913-8fb5709d6d57?auto=format&fit=crop&q=80&w=1200',
    overlayColor: 'rgba(26, 60, 52, 0.9)',  // Deep Green
  },
]

// Shell SVG Icon (matching Ocean Spray style)
function ShellIcon() {
  return (
    <svg width="44" height="50" viewBox="0 0 44 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3 opacity-90">
      <path d="M22 2C22 2 6 14 6 28C6 36.837 13.163 44 22 44C30.837 44 38 36.837 38 28C38 14 22 2 22 2Z" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M22 10C22 10 12 19 12 29C12 33.418 16.582 38 22 38" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M22 20C19.239 20 17 22.239 17 25" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <line x1="22" y1="44" x2="22" y2="49" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M15 48L22 50L29 48" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function AmenityCard({ amenity }: { amenity: AmenityCard }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative flex-1 overflow-hidden cursor-pointer"
      style={{ minHeight: '480px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background Image — zooms in slightly on hover */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${amenity.image})` }}
        animate={{ scale: hovered ? 1.06 : 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />

      {/* Teal Overlay — slides DOWN like a curtain on hover */}
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: amenity.overlayColor, transformOrigin: 'top center' }}
        animate={{ y: hovered ? '100%' : '0%' }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      />

      {/* Dark bottom gradient — always visible so text is readable even when overlay is gone */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)',
          zIndex: 2,
        }}
      />

      {/* Content — shell icon + title at bottom left (like Ocean Spray) */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 text-white">
        <ShellIcon />
        <h3
          className="text-xl font-light leading-snug"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.03em' }}
        >
          {amenity.title}
        </h3>

        {/* Book Now button slides up on hover */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 10 }}
          transition={{ duration: 0.35, delay: hovered ? 0.25 : 0 }}
          className="mt-4"
        >
          <Link
            to="/experiences"
            className="inline-block border border-white/80 text-white text-[10px] tracking-[0.2em] uppercase px-5 py-2 hover:bg-white hover:text-gray-900 transition-all duration-300 rounded-full"
          >
            Book Now
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

export function AmenitiesCards() {
  return (
    <section>
      {/* Section Header */}
      <div className="bg-background py-14 text-center">
        <h2
          className="text-3xl md:text-4xl font-light tracking-[0.25em] uppercase text-foreground"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Hotel Amenities
        </h2>
        <div className="w-12 h-px bg-primary mx-auto mt-5" />
      </div>

      {/* Desktop: Horizontal Cards with curtain-drop effect */}
      <div className="hidden md:flex" style={{ height: '480px' }}>
        {amenities.map((amenity) => (
          <AmenityCard key={amenity.id} amenity={amenity} />
        ))}
      </div>

      {/* Mobile: Vertical stacked cards */}
      <div className="flex md:hidden flex-col">
        {amenities.map((amenity) => (
          <div
            key={amenity.id}
            className="relative overflow-hidden"
            style={{ height: '240px' }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${amenity.image})` }}
            />
            <div
              className="absolute inset-0"
              style={{ backgroundColor: amenity.overlayColor }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
              }}
            />
            <div className="absolute bottom-0 left-0 p-5 text-white z-10">
              <ShellIcon />
              <h3 className="text-lg font-light" style={{ fontFamily: 'Georgia, serif' }}>
                {amenity.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
