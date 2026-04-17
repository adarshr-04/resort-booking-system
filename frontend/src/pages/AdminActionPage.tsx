import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function AdminActionPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processing your request...')

  useEffect(() => {
    const handleAction = async () => {
      const loginToken = searchParams.get('login_token')
      const actionToken = searchParams.get('token')

      if (!actionToken) {
        setStatus('error')
        setMessage('Invalid or missing security token.')
        return
      }

      try {
        // 1. Handle One-Click Login if token present
        if (loginToken) {
          try {
            const loginRes = await api.tokenLogin(loginToken)
            localStorage.setItem('access_token', loginRes.access)
            localStorage.setItem('refresh_token', loginRes.refresh)
          } catch (err) {
            console.error('One-click login failed, but continuing with action...', err)
          }
        }

        // 2. Perform the Booking Action
        const actionRes = await api.processBookingAction(actionToken)
        
        if (actionRes.status === 'success') {
          setStatus('success')
          setMessage(actionRes.message || 'Action completed successfully.')
          
          // Auto-redirect to bookings list after a short delay
          setTimeout(() => {
            navigate('/admin/bookings?toast=success&msg=' + encodeURIComponent(actionRes.message))
          }, 2000)
        }
      } catch (err: any) {
        setStatus('error')
        setMessage(err.message || 'An error occurred while processing the request.')
      }
    }

    handleAction()
  }, [searchParams, navigate])

  return (
    <main className="min-h-screen bg-secondary">
      <Navbar />

      <div className="pt-32 pb-20 container mx-auto px-6">
        <div className="max-w-md mx-auto bg-background text-center border border-border">
          <div className="p-8 lg:p-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center mb-8"
            >
              <div className={`p-4 rounded-full ${
                status === 'loading' ? 'bg-primary/10' : 
                status === 'success' ? 'bg-emerald-50' : 'bg-destructive/10'
              }`}>
                {status === 'loading' && <Loader2 className="w-12 h-12 text-primary animate-spin" />}
                {status === 'success' && <CheckCircle2 className="w-12 h-12 text-emerald-600" />}
                {status === 'error' && <AlertCircle className="w-12 h-12 text-destructive" />}
              </div>
            </motion.div>

            <span className="inline-block text-[10px] tracking-[0.3em] uppercase text-accent mb-4">
              {status === 'loading' ? 'Administration' : 'Process Update'}
            </span>
            
            <h1 className="text-2xl font-light tracking-wide mb-6">
              {status === 'loading' ? 'Authenticating...' : 
               status === 'success' ? 'Stay Confirmed' : 'Action Failed'}
            </h1>

            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              {message}
            </p>

            {status === 'error' && (
              <button
                onClick={() => navigate('/login')}
                className="w-full py-4 bg-primary text-primary-foreground text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-all"
              >
                Go to Login
              </button>
            )}

            {status === 'success' && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground animate-pulse">
                <ShieldCheck className="w-4 h-4" /> Securely redirecting to dashboard...
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
