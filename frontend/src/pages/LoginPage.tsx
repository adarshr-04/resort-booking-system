import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, ShieldCheck, ArrowRight, RotateCcw } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { api } from '@/lib/api'

type Step = 'credentials' | 'otp'

export default function LoginPage() {
  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [activeEmail, setActiveEmail] = useState('') 
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Step 1: Submit email + password
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.loginRequest({ email, password })
      if (res.otp_required === false && res.access) {
        // Staff/Admin Bypass
        localStorage.setItem('access_token', res.access)
        localStorage.setItem('refresh_token', res.refresh)
        navigate('/admin') // Redirect staff directly to admin panel
        return
      }
      
      if (res.otp_required) {
        setActiveEmail(res.email)
        setStep('otp')
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Submit OTP
  const handleOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.loginVerify({ email: activeEmail, otp })
      localStorage.setItem('access_token', res.access)
      localStorage.setItem('refresh_token', res.refresh)
      
      // Navigate everyone to the home page. Admins can click "Dashboard" in the navbar.
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-secondary">
      <Navbar />

      <div className="pt-32 pb-20 container mx-auto px-6">
        <div className="max-w-md mx-auto bg-background shadow-sm border border-border">

          <AnimatePresence mode="wait">
            {step === 'credentials' && (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
                className="p-8 lg:p-12"
              >
                <div className="text-center mb-10">
                  <span className="inline-block text-xs tracking-[0.25em] uppercase text-accent mb-4">Welcome Back</span>
                  <h1 className="text-3xl font-light tracking-wide">Sign In</h1>
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-4 mb-6 border border-destructive/20 text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleCredentials} className="space-y-6">
                  <div>
                    <label className="block text-xs tracking-wider uppercase mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs tracking-wider uppercase mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-primary text-primary-foreground text-sm tracking-wider uppercase hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Processing...' : (<>Sign In <ArrowRight className="w-4 h-4" /></>)}
                  </button>
                </form>

                <div className="mt-8 text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link to="/register" className="text-accent hover:underline uppercase tracking-wider text-xs font-medium">
                    Register Now
                  </Link>
                </div>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
                className="p-8 lg:p-12"
              >
                <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
                    <ShieldCheck className="w-8 h-8 text-accent" />
                  </div>
                  <span className="block text-xs tracking-[0.25em] uppercase text-accent mb-2">Security Verification</span>
                  <h1 className="text-2xl font-light tracking-wide">Enter Code</h1>
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                    A code has been sent to your email:<br />
                    <strong className="text-foreground">{activeEmail}</strong>
                  </p>
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-4 mb-6 border border-destructive/20 text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleOTP} className="space-y-6">
                  <div>
                    <label className="block text-xs tracking-wider uppercase mb-2 text-center">Verification Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      required
                      autoFocus
                      className="w-full py-4 text-center text-3xl tracking-[0.6em] font-mono border border-border bg-secondary focus:outline-none focus:ring-1 focus:ring-accent"
                      placeholder="000000"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full py-4 bg-accent text-white text-sm tracking-wider uppercase hover:bg-accent/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Verifying...' : (<><ShieldCheck className="w-4 h-4" /> Sign In</>)}
                  </button>
                </form>

                <button
                  onClick={() => { setStep('credentials'); setOtp(''); setError('') }}
                  className="mt-6 w-full text-center text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Go back
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Footer />
    </main>
  )
}
