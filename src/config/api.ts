// API Configuration for backend proxy
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  openai: {
    chat: `${API_BASE_URL}/api/openai/chat`,
    transcribe: `${API_BASE_URL}/api/openai/transcribe`,
  },
  grok: {
    chat: `${API_BASE_URL}/api/grok/chat`,
  },
} as const;
