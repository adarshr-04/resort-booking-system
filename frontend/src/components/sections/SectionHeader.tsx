import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  className?: string
}

export function SectionHeader({ eyebrow, title, description, className }: SectionHeaderProps) {
  return (
    <div className={cn('text-center max-w-2xl mx-auto', className)}>
      {eyebrow && <span className="inline-block text-xs tracking-[0.25em] uppercase text-accent mb-4">{eyebrow}</span>}
      <h2 className="text-3xl md:text-4xl font-light tracking-wide leading-tight mb-4">{title}</h2>
      {description && <p className="text-muted-foreground leading-relaxed">{description}</p>}
    </div>
  )
}
