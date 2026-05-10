import api from './client'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ToolCallTrace {
  name: string
  input: Record<string, unknown>
  result_preview?: string
}

export interface ChatResponse {
  reply: string
  tool_calls: ToolCallTrace[]
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>('/chat/message', { message, history })
  return data
}

export async function chatHealth(): Promise<{ configured: boolean }> {
  const { data } = await api.get<{ configured: boolean }>('/chat/health')
  return data
}
