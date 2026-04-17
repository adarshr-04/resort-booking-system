import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Calendar, X, Send } from 'lucide-react'
import { useState } from 'react'

export function FloatingActions() {
  const [showWhatsApp, setShowWhatsApp] = useState(false)
  const whatsappNumber = '919845666196' // Format: CountryCodePhoneNumber

  return (
    <div className="fixed bottom-8 left-8 z-[60] flex flex-col items-start gap-4">
      <AnimatePresence>
        {showWhatsApp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            className="bg-background border border-border p-6 shadow-2xl w-80 mb-2"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-medium tracking-wide">Concierge Enquiry</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Typical response: 5 mins</p>
              </div>
              <button onClick={() => setShowWhatsApp(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="bg-secondary/30 p-4 rounded text-xs leading-relaxed mb-6">
              "Hello! Welcome to Coorg Pristine Woods, Madikeri. How can we assist you with your stay today?"
            </div>

            <a 
              href={`https://wa.me/${whatsappNumber}?text=Hello! I am interested in booking a stay at Coorg Pristine Woods, Madikeri.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 text-xs tracking-widest uppercase font-bold hover:opacity-90 transition-all shadow-lg"
            >
              <Send className="w-4 h-4" />
              Start WhatsApp Chat
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3">
        <button 
          onClick={() => setShowWhatsApp(!showWhatsApp)}
          className="w-14 h-14 bg-[#25D366] text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform group relative"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute left-full ml-4 px-3 py-1 bg-primary text-white text-[10px] tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            WhatsApp Concierge
          </span>
        </button>

        <a 
          href="/accommodations"
          className="w-14 h-14 bg-accent text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform group relative"
        >
          <Calendar className="w-6 h-6" />
          <span className="absolute left-full ml-4 px-3 py-1 bg-primary text-white text-[10px] tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Book Now
          </span>
        </a>
      </div>
    </div>
  )
}
