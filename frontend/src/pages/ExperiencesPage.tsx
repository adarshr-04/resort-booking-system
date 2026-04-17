import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Hero } from '@/components/sections/Hero'
import { SectionHeader } from '@/components/sections/SectionHeader'
import { FeatureCard } from '@/components/sections/FeatureCard'
import { Newsletter } from '@/components/sections/Newsletter'

const experiences = [
  { title: 'Palace Wellness', description: 'Award-winning spa with indoor pool, saunas, and holistic treatments.', imageSrc: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070&auto=format&fit=crop', href: '/contact' },
  { title: 'Winter Sports', description: 'World-class skiing, snowboarding, and winter adventures in St. Moritz.', imageSrc: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=2070&auto=format&fit=crop', href: '/contact' },
  { title: 'Events & Meetings', description: 'Sophisticated event spaces for business and private celebrations.', imageSrc: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2069&auto=format&fit=crop', href: '/contact' },
]

export default function ExperiencesPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero title="Experiences" subtitle="Beyond the Ordinary" description="From rejuvenating spa treatments to exhilarating alpine adventures, every experience is curated to exceed expectations" imageSrc="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070&auto=format&fit=crop" height="large" showScrollIndicator={false} />

      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <SectionHeader eyebrow="Experiences" title="Discover Your Perfect Escape" description="Whether seeking relaxation, adventure, or cultural enrichment, Coorg Pristine Woods offers experiences unlike any other." className="mb-16" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {experiences.map((e) => <FeatureCard key={e.title} {...e} />)}
          </div>
        </div>
      </section>

      <Newsletter />
      <Footer />
    </main>
  )
}
