import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

interface FeatureCardProps {
  title: string
  description: string
  imageSrc: string
  href: string
}

export function FeatureCard({ title, description, imageSrc, href }: FeatureCardProps) {
  return (
    <Link to={href} className="group block overflow-hidden hover-lift">
      <div className="aspect-[4/3] overflow-hidden relative">
        <img src={imageSrc} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
          <h3 className="text-xl font-light tracking-wide mb-2">{title}</h3>
          <p className="text-sm text-white/80 leading-relaxed mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{description}</p>
          <span className="flex items-center gap-2 text-xs tracking-wider uppercase text-accent">
            Discover <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}
