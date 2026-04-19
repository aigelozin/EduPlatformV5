import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { SiteSettingsStyle } from '@/components/layout/SiteSettingsStyle'
import { OrganizationSchema } from '@/components/seo/SchemaOrg'
import { getSiteSettings } from '@/lib/settings/site-settings'
import '@/app/globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700'],
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: {
    default: 'WisdomWave — Образовательная платформа',
    template: '%s | WisdomWave',
  },
  description: 'WisdomWave — образовательная платформа: йога, массаж, фитнес, творчество онлайн',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()
  const siteSettings = await getSiteSettings()
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://eduplatform.ru'
  const orgSocials = Object.values(siteSettings.seo.socials).filter(Boolean)

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <SiteSettingsStyle />
        <OrganizationSchema
          name={siteSettings.seo.orgName || siteSettings.brand.siteName}
          url={base}
          phone={siteSettings.seo.phone || undefined}
          email={siteSettings.seo.email || undefined}
          socials={orgSocials.length ? orgSocials : undefined}
        />
      </head>
      <body className={`${outfit.variable} font-sans`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
