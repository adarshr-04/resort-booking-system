import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  subValue?: string
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function StatCard({ label, value, subValue, trend, className }: StatCardProps) {
  return (
    <div className={cn("bg-background p-6 shadow-sm border border-border group hover:border-accent transition-all duration-500", className)}>
      <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-4 group-hover:text-accent transition-colors">
        {label}
      </p>
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-3xl font-light tracking-tight">{value}</h3>
          {subValue && (
            <p className="text-xs text-muted-foreground mt-2">{subValue}</p>
          )}
        </div>
        {trend && (
          <div className={cn(
            "text-[10px] px-2 py-1 tracking-widest uppercase font-medium",
            trend === 'up' ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
          )}>
            {trend === 'up' ? "+ 14%" : "- 3%"}
          </div>
        )}
      </div>
    </div>
  )
}
