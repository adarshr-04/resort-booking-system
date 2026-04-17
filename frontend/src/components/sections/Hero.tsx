import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'

interface HeroProps {
  title?: string
  subtitle?: string
  description?: string
  imageSrc?: string
  showScrollIndicator?: boolean
  overlayOpacity?: number
  height?: 'full' | 'large' | 'medium'
  ctaText?: string
  ctaHref?: string
  videoSrc?: string
}

export function Hero({
  title = 'Timeless, Legendary, Incomparable',
  subtitle = 'The Palace of St. Moritz',
  description = 'Since 1896, the epitome of luxury hospitality in the heart of the Swiss Alps',
  imageSrc = 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop',
  showScrollIndicator = true,
  overlayOpacity = 40,
  height = 'full',
  ctaText = 'Discover More',
  ctaHref = '/about',
  videoSrc
}: HeroProps) {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => { setIsVisible(true) }, [])

  const heightClasses = { full: 'min-h-screen', large: 'min-h-[85vh]', medium: 'min-h-[70vh]' }

  return (
    <section className={`relative ${heightClasses[height]} flex items-center justify-center overflow-hidden`}>
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        {videoSrc ? (
          <>
            <video 
              key={videoSrc}
              autoPlay 
              muted 
              loop 
              playsInline 
              src={videoSrc}
              className="w-full h-full object-cover scale-105 opacity-100"
              poster={imageSrc}
            />
            <div className={`absolute inset-0 bg-black`} style={{ opacity: overlayOpacity / 100 }} />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${imageSrc})` }} />
            <div className={`absolute inset-0 bg-black`} style={{ opacity: overlayOpacity / 100 }} />
          </>
        )}
      </div>
      
      <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
        <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-light tracking-wide leading-tight mb-4">{title}</h1>
        </div>
        <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-xl md:text-2xl lg:text-3xl font-light tracking-[0.15em] uppercase mb-6 text-accent">{subtitle}</p>
        </div>
        <div className={`transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-base md:text-lg font-light leading-relaxed mb-10 text-white/80 max-w-2xl mx-auto">{description}</p>
        </div>
        <div className={`transition-all duration-1000 delay-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Link to={ctaHref} className="inline-block px-10 py-4 border border-accent text-accent text-sm tracking-[0.2em] uppercase hover:bg-accent hover:text-primary transition-all duration-300">
            {ctaText}
          </Link>
        </div>
      </div>

      {showScrollIndicator && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/60 animate-bounce">
          <ChevronDown className="w-8 h-8" />
        </div>
      )}
    </section>
  )
}
