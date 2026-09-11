import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import '@/styles/globals.css'

import { Header } from '@/components/site/header'
import { Footer } from '@/components/site/footer'
import { WhatsAppButton } from '@/components/site/whatsapp-button'
import { buildWhatsAppLink, getSiteSettings } from '@/lib/site'
import { SITE_NAME, SITE_URL } from '@/lib/seo'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['600'],
  display: 'swap',
  variable: '--font-fraunces',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Real Estate Advisory in Delhi NCR`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Buy, sell or invest in property across Noida, Greater Noida, the Yamuna Expressway and Delhi NCR. Verified listings, early access to new launches, and help with every step of the paperwork.',
  applicationName: SITE_NAME,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_IN',
    url: SITE_URL,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: true, address: true },
}

export const viewport: Viewport = {
  themeColor: '#4A0A14',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  const whatsappHref = buildWhatsAppLink(
    settings.contact.whatsapp,
    `Hi ${settings.companyName}, I would like to know more about your properties.`,
  )

  return (
    <html lang="en-IN" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-dvh bg-cream-50 antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-maroon-700 focus:px-4 focus:py-2 focus:text-sm focus:text-cream-50"
        >
          Skip to content
        </a>

        <Header phone={settings.contact.phone} phoneHref={settings.contact.telHref} />

        <main id="main">{children}</main>

        <Footer settings={settings} />
        <WhatsAppButton href={whatsappHref} />

        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#FAF7F2',
              border: '1px solid rgba(201,162,39,0.4)',
              color: '#1A1A1A',
            },
          }}
        />
      </body>
    </html>
  )
}
