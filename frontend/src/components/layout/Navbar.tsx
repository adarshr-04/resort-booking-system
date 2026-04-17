import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, Phone, Mail, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/accommodations', label: 'Accommodations' },
  { href: '/dining', label: 'Dining' },
  { href: '/experiences', label: 'Experiences' },
  { href: '/contact', label: 'Contact' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  
  const isDark = !isScrolled && location.pathname === '/'

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    
    // Check auth status
    const token = localStorage.getItem('access_token')
    setIsLoggedIn(!!token)

    if (token) {
      api.getCurrentUser()
        .then(user => setIsAdmin(user.is_staff))
        .catch(() => setIsAdmin(false))
    }

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    api.logout()
    setIsLoggedIn(false)
    navigate('/')
  }

  return (
    <>
      {/* Top Bar */}
      <div className="hidden lg:block bg-primary text-primary-foreground py-2">
        <div className="container mx-auto px-6 flex justify-between items-center text-sm">
          <div className="flex items-center gap-6">
            <span className="tracking-wider text-xs uppercase opacity-80">Summer Season: 5 June – 7 September 2026</span>
            <span className="text-accent">|</span>
            <span className="tracking-wider text-xs uppercase opacity-80">Winter Season: 3 December 2026 – 30 March 2027</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="tel:+41818371100" className="flex items-center gap-2 hover:text-accent transition-colors">
              <Phone className="w-3 h-3" /><span className="text-xs">+41 81 837 1100</span>
            </a>
            <a href="mailto:reservations@Pristine Woodspalace.com" className="flex items-center gap-2 hover:text-accent transition-colors">
              <Mail className="w-3 h-3" /><span className="text-xs">reservations@Pristine Woodspalace.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className={cn(
        'fixed top-0 lg:top-10 left-0 right-0 z-50 transition-all duration-500',
        isScrolled ? 'bg-background/95 backdrop-blur-md shadow-sm lg:top-0 h-20' : 'h-24'
      )}>
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex flex-col items-center group">
              <span className={cn('text-2xl md:text-3xl font-light tracking-[0.2em] transition-colors', isScrolled || !isDark ? 'text-primary' : 'text-white')}>
                PRISTINE WOODS
              </span>
              <span className={cn('text-xs tracking-[0.3em] uppercase transition-colors', isScrolled ? 'text-primary/70' : 'text-white/80')}>
                COORG
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link key={link.href} to={link.href}
                        className={cn(
                          'text-xs tracking-widest uppercase font-medium transition-colors hover:text-accent',
                          isScrolled ? 'text-muted-foreground' : 'text-white/80'
                        )}>{link.label}
                </Link>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-6">
              {isLoggedIn ? (
                <div className="flex items-center gap-4">
                  {isAdmin && (
                    <Link to="/admin/dashboard"
                      className={cn('p-2 transition-colors flex items-center gap-2 text-xs tracking-widest uppercase', 
                        isScrolled ? 'text-foreground hover:text-accent' : 'text-white hover:text-accent')}>
                      <LayoutDashboard className="w-4 h-4" />
                      <span className="hidden xl:inline">Dashboard</span>
                    </Link>
                  )}
                  <button onClick={handleLogout}
                    className={cn('p-2 transition-colors flex items-center gap-2 text-xs tracking-widest uppercase', 
                      isScrolled ? 'text-foreground hover:text-accent' : 'text-white hover:text-accent')}>
                    <LogOut className="w-4 h-4" />
                    <span className="hidden xl:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <Link to="/login"
                  className={cn('p-2 transition-colors flex items-center gap-2 text-xs tracking-widest uppercase', 
                    isScrolled ? 'text-foreground hover:text-accent' : 'text-white hover:text-accent')}>
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden xl:inline">Sign In</span>
                </Link>
              )}
              
              <Link to="/accommodations"
                  onClick={(e) => {
                    if (!isLoggedIn) {
                      e.preventDefault()
                      navigate('/login')
                    }
                  }}
                  className={cn(
                    "px-10 py-3.5 text-[11px] tracking-[0.25em] uppercase font-bold transition-all duration-300 rounded-none",
                    isScrolled 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "bg-white text-primary hover:bg-primary hover:text-white"
                  )}>Book Now</Link>
            </div>

            <button onClick={() => setIsOpen(!isOpen)}
              className={cn('lg:hidden p-2 transition-colors', isScrolled ? 'text-foreground' : 'text-white')}
              aria-label="Toggle menu">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className={cn('lg:hidden fixed inset-0 bg-background z-40 transition-all duration-500',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')}>
          <div className="flex flex-col items-center justify-center h-full gap-8">
            {navLinks.map((link, index) => (
              <Link key={link.href} to={link.href} onClick={() => setIsOpen(false)}
                className="text-2xl tracking-wider uppercase font-light text-foreground hover:text-accent transition-colors"
                style={{ animationDelay: `${index * 100}ms` }}>
                {link.label}
              </Link>
            ))}
            
            <div className="flex flex-col items-center gap-4 mt-8">
              {isLoggedIn ? (
                <button onClick={handleLogout} className="text-sm tracking-widest uppercase text-accent">Logout</button>
              ) : (
                <Link to="/login" onClick={() => setIsOpen(false)} className="text-sm tracking-widest uppercase text-accent">Sign In</Link>
              )}
              <Link to="/accommodations" 
                onClick={(e) => {
                  setIsOpen(false)
                  if (!isLoggedIn) {
                    e.preventDefault()
                    navigate('/login')
                  }
                }}
                className="px-12 py-4 bg-primary text-primary-foreground text-sm tracking-wider uppercase">
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
