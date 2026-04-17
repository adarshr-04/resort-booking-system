import { Link } from 'react-router-dom'
import { Users, Eye, ArrowRight } from 'lucide-react'

interface RoomCardProps {
  name: string
  description: string
  imageSrc: string
  size?: string
  capacity?: string
  view?: string
  href: string
  units?: number
}

export function RoomCard({ name, description, imageSrc, size, capacity, view, href, units }: RoomCardProps) {
  return (
    <div className="group hover-lift overflow-hidden bg-card border border-border">
      <div className="aspect-[4/3] overflow-hidden">
        <img src={imageSrc} alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-light tracking-wide">{name}</h3>
          {(units && units > 1) && (
            <span className="text-[10px] tracking-[0.2em] uppercase bg-accent/10 text-accent px-2 py-1 font-bold">
              {units} Units
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{description}</p>
        {(size || capacity || view) && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 border-t border-border pt-4">
            {size && <span>{size}</span>}
            {capacity && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{capacity}</span>}
            {view && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{view}</span>}
          </div>
        )}
        <Link to={href} className="inline-flex items-center gap-2 text-xs tracking-wider uppercase hover:text-accent transition-colors">
          Enquire <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
