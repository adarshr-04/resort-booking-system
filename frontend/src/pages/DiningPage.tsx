import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Hero } from '@/components/sections/Hero'
import { SectionHeader } from '@/components/sections/SectionHeader'
import { FeatureCard } from '@/components/sections/FeatureCard'
import { Newsletter } from '@/components/sections/Newsletter'

const restaurants = [
  { title: 'The King\'s Social House', description: 'The vibrant social heart of the hotel — live music, craft cocktails, and an international menu.', imageSrc: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop', href: '/contact' },
  { title: 'Chesa Veglia', description: 'A 400-year-old Engadine farmhouse serving superior Italian cuisine in a timeless setting.', imageSrc: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop', href: '/contact' },
  { title: 'The Palace Bar', description: 'An iconic gathering place for the world\'s elite since 1896, serving classic cocktails and fine wines.', imageSrc: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=2074&auto=format&fit=crop', href: '/contact' },
]

export default function DiningPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero title="Dining & Bars" subtitle="A Culinary Journey" description="From Michelin-starred cuisine to iconic après-ski gatherings, every dining experience is crafted to perfection" imageSrc="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop" height="large" showScrollIndicator={false} />

      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <SectionHeader eyebrow="Our Restaurants" title="World-Class Dining" description="Each of our restaurants and bars offers a unique culinary experience, from Swiss classics to international cuisine." className="mb-16" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {restaurants.map((r) => <FeatureCard key={r.title} {...r} />)}
          </div>
        </div>
      </section>

      <Newsletter />
      <Footer />
    </main>
  )
}
