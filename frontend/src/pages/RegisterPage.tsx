import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Phone, MapPin, ShieldCheck, ArrowRight, RotateCcw } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { api } from '@/lib/api'

type Step = 'form' | 'otp'

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('form')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: ''
  })
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Step 1: Submit Registration Data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await api.registerRequest({
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address
      })
      setStep('otp')
    } catch (err: any) {
      setError(err.message || 'Failed to start registration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP and Create Account
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.registerVerify({
        email: formData.email,
        otp: otp
      })
      // Account created and tokens returned
      localStorage.setItem('access_token', res.access)
      localStorage.setItem('refresh_token', res.refresh)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.')
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
            {step === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
                className="p-8 lg:p-12"
              >
                <div className="text-center mb-10">
                  <span className="inline-block text-xs tracking-[0.25em] uppercase text-accent mb-4">Join Our World</span>
                  <h1 className="text-3xl font-light tracking-wide">Create Account</h1>
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-4 mb-6 border border-destructive/20 text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs tracking-wider uppercase mb-2">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        name="email"
                        type="email" 
                        value={formData.email} 
                        onChange={handleChange}
                        required 
                        className="w-full pl-10 pr-4 py-3 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs tracking-wider uppercase mb-2">Password *</label>
                      <input 
                        name="password"
                        type="password" 
                        value={formData.password} 
                        onChange={handleChange}
                        required 
                        className="w-full px-4 py-3 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-xs tracking-wider uppercase mb-2">Confirm *</label>
                      <input 
                        name="confirmPassword"
                        type="password" 
                        value={formData.confirmPassword} 
                        onChange={handleChange}
                        required 
                        className="w-full px-4 py-3 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs tracking-wider uppercase mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        name="phone"
                        value={formData.phone} 
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="+91 ..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs tracking-wider uppercase mb-2">Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <textarea 
                        name="address"
                        value={formData.address} 
                        onChange={handleChange}
                        rows={2}
                        className="w-full pl-10 pr-4 py-3 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                        placeholder="Your residential address"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-4 bg-primary text-primary-foreground text-sm tracking-wider uppercase hover:bg-primary/90 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Processing...' : (<>Register <ArrowRight className="w-4 h-4" /></>)}
                  </button>
                </form>

                <div className="mt-8 text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/login" className="text-accent hover:underline uppercase tracking-wider text-xs font-medium">
                    Sign In
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
                  <span className="block text-xs tracking-[0.25em] uppercase text-accent mb-2">Verify Email</span>
                  <h1 className="text-2xl font-light tracking-wide">Enter Code</h1>
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                    We've sent a 6-digit code to:<br />
                    <strong className="text-foreground">{formData.email}</strong>
                  </p>
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-4 mb-6 border border-destructive/20 text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleVerify} className="space-y-6">
                  <div>
                    <label className="block text-xs tracking-wider uppercase mb-2 text-center">Enter Code</label>
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
                    {loading ? 'Creating Account...' : (<><ShieldCheck className="w-4 h-4" /> Finalize Registration</>)}
                  </button>
                </form>

                <button
                  onClick={() => { setStep('form'); setOtp(''); setError('') }}
                  className="mt-6 w-full text-center text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Go back and edit details
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
