import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Loader2, ConciergeBell } from 'lucide-react'

interface Message {
  role: 'user' | 'bot'
  content: string
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: 'Hello! Welcome to Coorg Pristine Woods. I am your personal AI concierge. How can I assist you with your stay today?' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasNotification, setHasNotification] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsLoading(true)

    try {
      // We will implement this endpoint in Phase 3
      const response = await fetch('/api/chatbot/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      })
      
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.reply || `Server returned ${response.status}`)
      }

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'bot', content: data.reply }])
    } catch (error: any) {
      console.error('Chatbot Error:', error)
      setMessages(prev => [...prev, { role: 'bot', content: `Connection Error: ${error.message || 'Unknown error'}` }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-8 right-8 z-[60]">
        <button
          onClick={() => {
            setIsOpen(!isOpen)
            setHasNotification(false)
          }}
          className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform relative group"
        >
          <MessageSquare className="w-6 h-6" />
          
          {hasNotification && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
              1
            </span>
          )}

          <span className="absolute right-full mr-4 px-3 py-1 bg-primary text-white text-[10px] tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            AI Concierge
          </span>
        </button>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-28 right-8 z-[60] w-[350px] sm:w-[400px] h-[500px] bg-background border border-border shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent flex items-center justify-center">
                  <ConciergeBell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium tracking-wide">AI Concierge</h4>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-white/70 uppercase tracking-widest">Online Now</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:text-accent transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/10">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 text-xs leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white ml-8' 
                      : 'bg-background border border-border mr-8'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-background border border-border p-3 mr-8 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-background border-t border-border flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about check-in, dining, or activities..."
                className="flex-1 bg-secondary/30 border-none px-4 py-2 text-xs focus:ring-1 focus:ring-accent outline-none"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="bg-accent text-white p-2 hover:bg-accent/90 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
