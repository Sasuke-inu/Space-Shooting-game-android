import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { config } from '../config/env';

const router = Router();

// Initialize Grok client (uses OpenAI-compatible API)
const grok = new OpenAI({
  apiKey: config.apiKeys.grok,
  baseURL: 'https://api.x.ai/v1',
});

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

// POST /api/grok/chat - Chat completions
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages, temperature = 0.7, maxTokens = 2048, model = 'grok-beta' }: ChatRequest = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const response = await grok.chat.completions.create({
      model,
      messages: messages as any,
      temperature,
      max_tokens: maxTokens,
    });

    return res.json({
      content: response.choices[0]?.message?.content || '',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    });
  } catch (error: any) {
    console.error('Grok chat error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process chat request' });
  }
});

export default router;
