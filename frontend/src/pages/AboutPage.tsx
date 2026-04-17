import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Hero } from '@/components/sections/Hero'
import { SectionHeader } from '@/components/sections/SectionHeader'
import { Newsletter } from '@/components/sections/Newsletter'

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero title="Our Story" subtitle="A Legacy of Excellence" description="From a vision of pure hospitality to a world-renowned destination — the story of Coorg Pristine Woods" imageSrc="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2070&auto=format&fit=crop" height="large" showScrollIndicator={false} />

      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6 max-w-4xl">
          <SectionHeader eyebrow="Our Heritage" title="A Legacy Born of Passion" className="mb-12" />
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground leading-relaxed">
            <p>Beginning as a vision of pure luxury in the heart of Coorg, our journey has been one of extraordinary dedication to the art of hospitality. Coorg Pristine Woods, as it stands today, represents the pinnacle of refined living and personalized service.</p>
            <p>Our story is rooted in the belief that true luxury is found in the perfect harmony between nature and comfort. We invite our guests to experience the misty mornings and lush coffee plantations of Coorg with the finest modern amenities.</p>
            <p>Over the years, Coorg Pristine Woods has welcomed discerning travelers from every corner of the globe seeking the finest in luxury escape and Indian hospitality.</p>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-32 bg-secondary">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[{ number: '1896', label: 'Founded' }, { number: '157', label: 'Rooms & Suites' }, { number: '5★', label: 'Rating' }].map(({ number, label }) => (
              <div key={label} className="p-8">
                <p className="text-5xl font-light text-accent mb-2">{number}</p>
                <p className="text-sm tracking-wider uppercase text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Newsletter />
      <Footer />
    </main>
  )
}
