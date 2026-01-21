import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiKeys: {
    openai: process.env.OPENAI_API_KEY || '',
    anthropic: process.env.ANTHROPIC_API_KEY || '',
    grok: process.env.GROK_API_KEY || '',
    google: process.env.GOOGLE_API_KEY || '',
    elevenlabs: process.env.ELEVENLABS_API_KEY || '',
  },
};

// Validation
const requiredKeys = ['openai', 'grok'] as const;
const missingKeys = requiredKeys.filter(key => !config.apiKeys[key]);

if (missingKeys.length > 0) {
  console.warn(`Warning: Missing API keys: ${missingKeys.join(', ')}`);
  console.warn('Some endpoints may not function correctly');
}
