/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom client for the Grok API that proxies requests through the backend.
This prevents API keys from being exposed in the client-side bundle.

grok-3-latest
grok-3-fast-latest
grok-3-mini-latest
*/
import { API_ENDPOINTS } from '../config/api';

// Proxy client that mimics OpenAI SDK interface (Grok uses OpenAI-compatible API)
class GrokProxyClient {
  chat = {
    completions: {
      create: async (params: {
        model: string;
        messages: Array<{ role: string; content: string }>;
        temperature?: number;
        max_tokens?: number;
      }) => {
        const response = await fetch(API_ENDPOINTS.grok.chat, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: params.messages,
            temperature: params.temperature,
            maxTokens: params.max_tokens,
            model: params.model,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to get response from Grok');
        }

        const data = await response.json();

        // Transform response to match OpenAI SDK format
        return {
          choices: [{
            message: {
              content: data.content,
            },
          }],
          usage: {
            prompt_tokens: data.usage.promptTokens,
            completion_tokens: data.usage.completionTokens,
            total_tokens: data.usage.totalTokens,
          },
        };
      },
    },
  };
}

export const getGrokClient = () => {
  return new GrokProxyClient();
};
