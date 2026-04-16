import { getSiteSettings } from '@/lib/settings/site-settings'

const FONT_URLS: Record<string, string> = {
  'PT Serif':
    'https://fonts.googleapis.com/css2?family=PT+Serif:ital,wght@0,400;0,700;1,400&display=swap',
  'PT Sans': 'https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap',
  'Playfair Display':
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap',
  Inter: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
  'Cormorant Garamond':
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600&display=swap',
  Lato: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap',
  Merriweather:
    'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap',
  Nunito: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap',
}

const BASE_SIZES: Record<string, string> = { sm: '14px', md: '16px', lg: '18px' }

export async function SiteSettingsStyle() {
  const s = await getSiteSettings()
  const headingUrl = FONT_URLS[s.typography.headingFont]
  const bodyUrl = FONT_URLS[s.typography.bodyFont]
  const css = `
    :root {
      --primary-color: ${s.brand.primaryColor};
      --bg-color: ${s.brand.backgroundColor};
      --font-heading: '${s.typography.headingFont}', Georgia, serif;
      --font-body: '${s.typography.bodyFont}', Arial, sans-serif;
      --base-font-size: ${BASE_SIZES[s.typography.baseFontSize] ?? '16px'};
    }
  `
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      {headingUrl && <link rel="stylesheet" href={headingUrl} />}
      {bodyUrl && s.typography.bodyFont !== s.typography.headingFont && (
        <link rel="stylesheet" href={bodyUrl} />
      )}
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  )
}
