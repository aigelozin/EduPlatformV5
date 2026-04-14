import { yandexGPTStream } from './yandexgpt'
import { claudeStream } from './claude'
import type { ChatMessage } from '@/types'

const CHAT_SYSTEM_PROMPT = `Ты помощник образовательной платформы EduPlatform.
Помогаешь студентам найти подходящие курсы, отвечаешь на вопросы о преподавателях и программах.
Отвечай кратко и по-русски. Не придумывай информацию — только то, что знаешь наверняка.
Если не знаешь ответа — предложи обратиться в поддержку: support@eduplatform.ru`

/**
 * Стриминговый чат (YandexGPT primary, Claude fallback).
 * Возвращает ReadableStream<string> для использования в SSE endpoint.
 */
export async function streamChat(messages: ChatMessage[]): Promise<ReadableStream<string>> {
  // Primary: YandexGPT
  try {
    return await yandexGPTStream(messages, CHAT_SYSTEM_PROMPT)
  } catch (err) {
    console.error('[chat] YandexGPT stream failed, trying Claude:', err)
  }

  // Fallback: Claude
  return claudeStream(messages, CHAT_SYSTEM_PROMPT)
}
