import type { ChatMessage } from '@/types'

const YANDEXGPT_ENDPOINT = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion'
const YANDEXGPT_STREAM_ENDPOINT = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completionAsync'

function getModel(): string {
  const folderId = process.env.YANDEXGPT_FOLDER_ID!
  const model = process.env.YANDEXGPT_MODEL ?? 'yandexgpt-lite'
  return `gpt://${folderId}/${model}`
}

function getHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Api-Key ${process.env.YANDEXGPT_API_KEY!}`,
    'x-folder-id': process.env.YANDEXGPT_FOLDER_ID!,
  }
}

interface YandexGPTMessage {
  role: 'system' | 'user' | 'assistant'
  text: string
}

interface YandexGPTResponse {
  result: {
    alternatives: Array<{
      message: { role: string; text: string }
      status: string
    }>
    usage: { inputTextTokens: string; completionTokens: string; totalTokens: string }
  }
}

/**
 * Синхронный запрос к YandexGPT (для SEO и коротких ответов).
 */
export async function yandexGPTComplete(
  messages: YandexGPTMessage[],
  temperature: number = 0.3
): Promise<string> {
  const res = await fetch(YANDEXGPT_ENDPOINT, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      modelUri: getModel(),
      completionOptions: {
        stream: false,
        temperature,
        maxTokens: 2000,
      },
      messages,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`YandexGPT error ${res.status}: ${text}`)
  }

  const data = (await res.json()) as YandexGPTResponse
  return data.result.alternatives[0]?.message.text ?? ''
}

/**
 * Стриминговый чат через YandexGPT.
 * Возвращает ReadableStream для Server-Sent Events.
 */
export async function yandexGPTStream(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<ReadableStream<string>> {
  const yMessages: YandexGPTMessage[] = [
    ...(systemPrompt ? [{ role: 'system' as const, text: systemPrompt }] : []),
    ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', text: m.content })),
  ]

  const res = await fetch(YANDEXGPT_ENDPOINT, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      modelUri: getModel(),
      completionOptions: {
        stream: true,
        temperature: 0.6,
        maxTokens: 1500,
      },
      messages: yMessages,
    }),
  })

  if (!res.ok || !res.body) {
    throw new Error(`YandexGPT stream error ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  return new ReadableStream<string>({
    async pull(controller) {
      const { done, value } = await reader.read()
      if (done) {
        controller.close()
        return
      }
      const chunk = decoder.decode(value, { stream: true })
      // YandexGPT стримит JSON-объекты построчно
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed) continue
        try {
          const obj = JSON.parse(trimmed) as YandexGPTResponse
          const text = obj.result?.alternatives?.[0]?.message?.text
          if (text) controller.enqueue(text)
        } catch {
          // неполный чанк — пропускаем
        }
      }
    },
  })
}
