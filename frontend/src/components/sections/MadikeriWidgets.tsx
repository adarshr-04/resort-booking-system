import { motion } from 'framer-motion'
import { Cloud, Mountain, ThermometerSun } from 'lucide-react'
import { useState, useEffect } from 'react'

export function MadikeriWidgets() {
  const [temp, setTemp] = useState<number | null>(null)
  
  // Simulated Elevation Counter
  const countTo = 1150
  const [elevation, setElevation] = useState(0)

  useEffect(() => {
    // 1. Fetch Real Weather for Coorg/Madikeri using Open-Meteo (free, no API key)
    // Madikeri, Coorg GPS: 12.4244° N, 75.7382° E
    async function fetchWeather() {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=12.4244&longitude=75.7382&current_weather=true&temperature_unit=celsius'
        )
        const data = await res.json()
        if (data?.current_weather?.temperature !== undefined) {
          setTemp(Math.round(data.current_weather.temperature))
        }
      } catch (err) {
        console.error('Weather fetch failed:', err)
        setTemp(22) // Fallback
      }
    }

    fetchWeather()

    // 2. Elevation Animation
    let start = 0
    const duration = 2000
    const increment = countTo / (duration / 16)
    
    const timer = setInterval(() => {
      start += increment
      if (start >= countTo) {
        setElevation(countTo)
        clearInterval(timer)
      } else {
        setElevation(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-6">
      {/* Weather Widget */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-4 bg-secondary/30 backdrop-blur-md px-6 py-4 border border-primary/10 shadow-sm"
      >
        <div className="flex flex-col">
          <span className="text-[9px] tracking-[0.3em] uppercase text-primary/60 font-bold mb-1.5">Madikeri (Coorg)</span>
          <div className="flex items-center gap-3">
            <ThermometerSun className="w-5 h-5 text-accent" />
            <span className="text-xl font-light text-primary">
              {temp !== null ? `${temp}°C` : '--°C'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Elevation Widget */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7 }}
        className="flex items-center gap-4 bg-secondary/30 backdrop-blur-md px-6 py-4 border border-primary/10 shadow-sm"
      >
        <div className="flex flex-col">
          <span className="text-[9px] tracking-[0.3em] uppercase text-primary/60 font-bold mb-1.5">Resort Elevation</span>
          <div className="flex items-center gap-3">
            <Mountain className="w-5 h-5 text-accent" />
            <span className="text-xl font-light tracking-wider text-primary">
              {elevation.toLocaleString()}m
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
