import Anthropic from '@anthropic-ai/sdk'
import type { ChatMessage } from '@/types'

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  }
  return client
}

/**
 * Claude API fallback для синхронных запросов (SEO генерация).
 * Используется когда YandexGPT недоступен.
 */
export async function claudeComplete(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const anthropic = getClient()

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    ...(systemPrompt && { system: systemPrompt }),
    messages: [{ role: 'user', content: prompt }],
  })

  const block = message.content[0]
  return block.type === 'text' ? block.text : ''
}

/**
 * Claude API стриминговый чат (fallback).
 */
export async function claudeStream(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<ReadableStream<string>> {
  const anthropic = getClient()

  const stream = await anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    ...(systemPrompt && { system: systemPrompt }),
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })

  return new ReadableStream<string>({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(chunk.delta.text)
        }
      }
      controller.close()
    },
  })
}
