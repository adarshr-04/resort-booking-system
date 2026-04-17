interface TestimonialCardProps {
  quote: string
  author: string
  location: string
}

export function TestimonialCard({ quote, author, location }: TestimonialCardProps) {
  return (
    <div className="p-8 border border-border bg-card">
      <div className="text-4xl text-accent font-serif mb-4">&ldquo;</div>
      <p className="text-muted-foreground leading-relaxed italic mb-6">{quote}</p>
      <div>
        <p className="font-medium text-sm">{author}</p>
        <p className="text-xs text-muted-foreground tracking-wider uppercase mt-1">{location}</p>
      </div>
    </div>
  )
}
