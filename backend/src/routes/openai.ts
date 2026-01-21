import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import multer from 'multer';
import FormData from 'form-data';
import { config } from '../config/env';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.apiKeys.openai,
});

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

// POST /api/openai/chat - Chat completions
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages, temperature = 0.7, maxTokens = 2048, model = 'gpt-4o' }: ChatRequest = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const response = await openai.chat.completions.create({
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
    console.error('OpenAI chat error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process chat request' });
  }
});

// POST /api/openai/transcribe - Audio transcription
router.post('/transcribe', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname || 'audio.webm',
      contentType: req.file.mimetype,
    });
    formData.append('model', 'whisper-1');

    const response = await openai.audio.transcriptions.create({
      file: req.file as any,
      model: 'whisper-1',
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error('OpenAI transcribe error:', error);
    return res.status(500).json({ error: error.message || 'Failed to transcribe audio' });
  }
});

export default router;
