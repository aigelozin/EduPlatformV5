interface OrganizationSchemaProps {
  name: string
  url: string
  phone?: string
  email?: string
  socials?: string[]
}

export function OrganizationSchema({
  name,
  url,
  phone,
  email,
  socials,
}: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    ...(phone && { telephone: phone }),
    ...(email && { email }),
    ...(socials?.length && { sameAs: socials }),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface CourseSchemaProps {
  name: string
  description: string
  price: number
  teacherName: string
  teacherCity?: string | null
  reviewCount?: number
  ratingValue?: number
}

export function CourseSchema({
  name,
  description,
  price,
  teacherName,
  teacherCity,
  reviewCount,
  ratingValue,
}: CourseSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name,
    description,
    provider: {
      '@type': 'Person',
      name: teacherName,
      ...(teacherCity && {
        address: {
          '@type': 'PostalAddress',
          addressLocality: teacherCity,
          addressCountry: 'RU',
        },
      }),
    },
    offers: {
      '@type': 'Offer',
      price: (price / 100).toFixed(2),
      priceCurrency: 'RUB',
      availability: 'https://schema.org/InStock',
    },
    ...(reviewCount && ratingValue && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: ratingValue.toFixed(1),
        reviewCount,
      },
    }),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface PersonSchemaProps {
  name: string
  url: string
  description?: string
  city?: string | null
  image?: string | null
}

export function PersonSchema({ name, url, description, city, image }: PersonSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url,
    ...(description && { description }),
    ...(image && { image }),
    ...(city && {
      address: {
        '@type': 'PostalAddress',
        addressLocality: city,
        addressCountry: 'RU',
      },
    }),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface ItemListSchemaProps {
  name: string
  url: string
  items: Array<{ name: string; url: string }>
}

export function ItemListSchema({ name, url, items }: ItemListSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url,
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      url: item.url,
    })),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
