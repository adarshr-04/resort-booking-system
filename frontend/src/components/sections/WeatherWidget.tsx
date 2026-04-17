import { Cloud, CloudSnow, Sun } from 'lucide-react'

interface WeatherWidgetProps {
  temperature: number
  condition: 'snow' | 'cloudy' | 'sunny'
}

export function WeatherWidget({ temperature, condition }: WeatherWidgetProps) {
  const icons = { snow: CloudSnow, cloudy: Cloud, sunny: Sun }
  const Icon = icons[condition]
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-8 h-8 text-accent" />
      <div>
        <p className="text-2xl font-light">{temperature}°C</p>
        <p className="text-xs tracking-wider uppercase text-muted-foreground">St. Moritz</p>
      </div>
    </div>
  )
}
