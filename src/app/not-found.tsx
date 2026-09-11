import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/site/page-hero'
import { Section } from '@/components/site/section'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <>
      <PageHero
        eyebrow="404"
        title="We could not find that page"
        lede="The property may have been sold, or the link may have changed. Here are the places worth trying instead."
      />
      <Section className="bg-cream-50">
        <div className="container flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/inventory">Browse inventory</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/projects">See projects</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Talk to us</Link>
          </Button>
        </div>
      </Section>
    </>
  )
}
