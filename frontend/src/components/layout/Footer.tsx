import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Instagram, Facebook, Youtube } from 'lucide-react'

const footerLinks = {
  hotel: [
    { href: '/about', label: 'Our Story' },
    { href: '/accommodations', label: 'Rooms & Suites' },
    { href: '/dining', label: 'Restaurants & Bars' },
    { href: '/experiences', label: 'Experiences' },
  ],
  services: [
    { href: '/experiences', label: 'Spa & Wellness' },
    { href: '/experiences', label: 'Events & Meetings' },
    { href: '/experiences', label: 'Winter Sports' },
    { href: '/experiences', label: 'Concierge' },
  ],
  information: [
    { href: '/contact', label: 'Contact Us' },
    { href: '/about', label: 'Location' },
    { href: '/about', label: 'Careers' },
    { href: '/about', label: 'Press' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-6">
              <h3 className="text-3xl font-light tracking-[0.15em]">PRISTINE WOODS</h3>
              <p className="text-xs tracking-[0.3em] uppercase text-accent mt-1">COORG</p>
            </Link>
            <p className="text-sm leading-relaxed opacity-80 max-w-sm mb-8">
              A sanctuary of luxury nestled in the lush Western Ghats, Coorg Pristine Woods is the epitome of fine hospitality in the heart of Karnataka.
            </p>
            <div className="space-y-3">
              <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-3 text-sm opacity-80 hover:opacity-100 transition-opacity">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Madikeri - Virajpet Rd<br />Coorg, Karnataka, India</span>
              </a>
              <a href="tel:+918000000000" className="flex items-center gap-3 text-sm opacity-80 hover:opacity-100 transition-opacity">
                <Phone className="w-4 h-4 flex-shrink-0" /><span>+91 800 000 0000</span>
              </a>
              <a href="mailto:reservations@pristinewoods.com" className="flex items-center gap-3 text-sm opacity-80 hover:opacity-100 transition-opacity">
                <Mail className="w-4 h-4 flex-shrink-0" /><span>reservations@pristinewoods.com</span>
              </a>
              <div className="pt-4 border-t border-white/10 mt-6 space-y-1.5">
                <p className="text-[10px] tracking-widest uppercase text-accent font-medium mb-2">Distance to Airports</p>
                <div className="flex justify-between items-center text-xs opacity-80">
                  <span>Mangaluru (IXE)</span>
                  <span>~ 140 km</span>
                </div>
                <div className="flex justify-between items-center text-xs opacity-80">
                  <span>Bengaluru (BLR)</span>
                  <span>~ 290 km</span>
                </div>
              </div>
            </div>
          </div>

          {(['hotel', 'services', 'information'] as const).map((key, i) => (
            <div key={key}>
              <h4 className="text-sm tracking-wider uppercase mb-6 font-medium">
                {key === 'hotel' ? 'The Hotel' : key === 'services' ? 'Services' : 'Information'}
              </h4>
              <ul className="space-y-3">
                {footerLinks[key].map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm opacity-70 hover:opacity-100 transition-opacity">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs opacity-60">© {new Date().getFullYear()} Pristine Woods&apos;s Pristine Woods. All rights reserved.</p>
            <div className="flex items-center gap-4">
              {[{ href: 'https://instagram.com', Icon: Instagram, label: 'Instagram' },
                { href: 'https://facebook.com', Icon: Facebook, label: 'Facebook' },
                { href: 'https://youtube.com', Icon: Youtube, label: 'YouTube' }].map(({ href, Icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className="p-2 opacity-60 hover:opacity-100 transition-opacity" aria-label={label}>
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
            <div className="flex items-center gap-4 text-xs opacity-60">
              <Link to="/about" className="hover:opacity-100 transition-opacity">Privacy Policy</Link>
              <span>|</span>
              <Link to="/about" className="hover:opacity-100 transition-opacity">Terms & Conditions</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
