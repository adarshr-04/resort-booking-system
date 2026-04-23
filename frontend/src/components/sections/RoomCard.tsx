import { Users, ArrowRight } from 'lucide-react'

interface RoomCardProps {
  room: {
    id: number
    name: string
    description: string
    price_per_night: number
    capacity: number
    images: { image: string }[]
  }
  units?: number
  onBookNow: (room: any) => void
}

export function RoomCard({ room, units, onBookNow }: RoomCardProps) {
  return (
    <div className="group hover-lift overflow-hidden bg-card border border-border">
      <div className="aspect-[4/3] overflow-hidden">
        <img 
          src={room.images[0]?.image || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=2074&auto=format&fit=crop'} 
          alt={room.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-light tracking-wide">{room.name}</h3>
          {(units && units > 1) && (
            <span className="text-[10px] tracking-[0.2em] uppercase bg-accent/10 text-accent px-2 py-1 font-bold">
              {units} Units
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{room.description}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 border-t border-border pt-4">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> up to {room.capacity} Guests</span>
          <span className="ml-auto text-accent font-medium">₹{room.price_per_night.toLocaleString()} / night</span>
        </div>
        
        <button 
          onClick={() => onBookNow(room)}
          className="w-full inline-flex items-center justify-center gap-2 bg-accent text-white py-3 text-[10px] tracking-[0.2em] uppercase font-bold hover:bg-accent/90 transition-all"
        >
          Book Now <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
