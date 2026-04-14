import { yandexGPTComplete } from './yandexgpt'
import { claudeComplete } from './claude'
import type { SeoGenerationResult } from '@/types'

const SEO_SYSTEM_PROMPT = `Ты SEO-специалист для российской образовательной платформы.
Генерируй SEO-теги на русском языке.
Отвечай строго в формате JSON: {"seo_title": "...", "seo_description": "..."}.
SEO title: до 60 символов, включать ключевые слова.
SEO description: 120-160 символов, привлекательное описание с призывом к действию.`

interface ProductInput {
  title_ru: string
  description_ru?: string | null
  type: string
  category?: string | null
}

/**
 * Генерирует SEO title и description через YandexGPT (primary) / Claude (fallback).
 */
export async function generateSEO(product: ProductInput): Promise<SeoGenerationResult> {
  const prompt = `Продукт: "${product.title_ru}"
Тип: ${product.type}
${product.category ? `Категория: ${product.category}` : ''}
${product.description_ru ? `Описание: ${product.description_ru.slice(0, 300)}` : ''}

Сгенерируй SEO title и description.`

  // Primary: YandexGPT
  try {
    const raw = await yandexGPTComplete(
      [{ role: 'user', text: prompt }],
      0.3
    )
    return parseSEOResponse(raw, product.title_ru)
  } catch (yandexErr) {
    console.error('[seo] YandexGPT failed, falling back to Claude:', yandexErr)
  }

  // Fallback: Claude
  try {
    const raw = await claudeComplete(prompt, SEO_SYSTEM_PROMPT)
    return parseSEOResponse(raw, product.title_ru)
  } catch (claudeErr) {
    console.error('[seo] Claude fallback also failed:', claudeErr)
  }

  // Fallback статический
  return {
    seo_title_ru: product.title_ru.slice(0, 60),
    seo_description_ru: `${product.title_ru} — онлайн обучение на EduPlatform. Записывайтесь сейчас!`,
  }
}

function parseSEOResponse(raw: string, fallbackTitle: string): SeoGenerationResult {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in response')

  const parsed = JSON.parse(match[0]) as {
    seo_title?: string
    seo_description?: string
  }

  return {
    seo_title_ru: (parsed.seo_title ?? fallbackTitle).slice(0, 60),
    seo_description_ru: (parsed.seo_description ?? '').slice(0, 160),
  }
}
