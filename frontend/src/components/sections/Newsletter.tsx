import { useState } from 'react'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) { setSubmitted(true) }
  }

  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-6 text-center max-w-2xl">
        <span className="inline-block text-xs tracking-[0.25em] uppercase text-accent mb-4">Stay Connected</span>
        <h2 className="text-3xl font-light tracking-wide mb-4">Join Our World</h2>
        <p className="text-muted-foreground leading-relaxed mb-8">
          Subscribe to receive exclusive offers, seasonal news, and a glimpse into life at Coorg Pristine Woods.
        </p>
        {submitted ? (
          <p className="text-accent tracking-wider">Thank you for subscribing.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address" required
              className="flex-1 px-4 py-3 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent" />
            <button type="submit"
              className="px-8 py-3 bg-primary text-primary-foreground text-sm tracking-wider uppercase hover:bg-primary/90 transition-colors">
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
