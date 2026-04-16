import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db/client'

export type SiteSettingsBrand = {
  siteName: string
  slogan: string
  primaryColor: string
  backgroundColor: string
  logoUrl: string | null
  faviconUrl: string | null
}

export type SiteSettingsTypography = {
  headingFont: string
  bodyFont: string
  baseFontSize: 'sm' | 'md' | 'lg'
}

export type SiteSettingsHomepage = {
  heroTitle: string
  heroSubtitle: string
  heroPrimaryCtaText: string
  heroSecondaryCtaText: string
  navLabels: Record<string, string>
  sections: Record<string, { label: string; visible: boolean }>
}

export type SiteSettingsSeo = {
  orgName: string
  phone: string
  email: string
  country: string
  titleTemplate: string
  defaultMetaDescription: string
  ogImageUrl: string | null
  aiDescription: string
  keywords: string
  socials: Record<string, string>
}

export type SiteSettings = {
  brand: SiteSettingsBrand
  typography: SiteSettingsTypography
  homepage: SiteSettingsHomepage
  seo: SiteSettingsSeo
}

export const DEFAULT_SETTINGS: SiteSettings = {
  brand: {
    siteName: 'EduPlatform',
    slogan: 'Йога · Массаж · Фитнес',
    primaryColor: '#4a7c59',
    backgroundColor: '#f8f7f4',
    logoUrl: null,
    faviconUrl: null,
  },
  typography: {
    headingFont: 'PT Serif',
    bodyFont: 'PT Sans',
    baseFontSize: 'md',
  },
  homepage: {
    heroTitle: 'Учись у лучших преподавателей',
    heroSubtitle:
      'Йога, массаж, фитнес, творчество и бизнес — онлайн-курсы, прямые трансляции и физические товары в одном месте.',
    heroPrimaryCtaText: 'Смотреть курсы',
    heroSecondaryCtaText: 'Подписки',
    navLabels: {
      catalog: 'Каталог',
      subscriptions: 'Подписки',
      teachers: 'Преподаватели',
      shop: 'Магазин',
    },
    sections: {
      popularProducts: { label: 'Популярные курсы', visible: true },
      livestreams: { label: 'Прямые трансляции', visible: true },
      reviews: { label: 'Отзывы студентов', visible: false },
    },
  },
  seo: {
    orgName: '',
    phone: '',
    email: '',
    country: 'Россия',
    titleTemplate: '{title} | EduPlatform',
    defaultMetaDescription:
      'Онлайн-курсы йоги, массажа, фитнеса — от лучших преподавателей России.',
    ogImageUrl: null,
    aiDescription: '',
    keywords: 'йога, массаж, фитнес, творчество, бизнес',
    socials: {},
  },
}

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    try {
      const row = await db.siteSettings.findUnique({ where: { id: 'main' } })
      if (!row) return DEFAULT_SETTINGS
      return {
        brand: { ...DEFAULT_SETTINGS.brand, ...(row.brand as object) } as SiteSettingsBrand,
        typography: {
          ...DEFAULT_SETTINGS.typography,
          ...(row.typography as object),
        } as SiteSettingsTypography,
        homepage: {
          ...DEFAULT_SETTINGS.homepage,
          ...(row.homepage as object),
        } as SiteSettingsHomepage,
        seo: { ...DEFAULT_SETTINGS.seo, ...(row.seo as object) } as SiteSettingsSeo,
      }
    } catch {
      return DEFAULT_SETTINGS
    }
  },
  ['site-settings'],
  { revalidate: 60, tags: ['site-settings'] }
)
