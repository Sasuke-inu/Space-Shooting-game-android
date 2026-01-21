# Space Shooter Backend Proxy Server

A secure backend proxy server that handles API key authentication for the Space Shooter mobile app. This server proxies requests to external AI services (OpenAI, Grok) while keeping API keys secure on the server side.

## Purpose

This backend was created to prevent API key exposure in the mobile app. Instead of bundling API keys into the client-side JavaScript, the mobile app makes requests to this backend, which securely forwards them to external services.

**Security Benefits:**
- API keys never exposed in mobile app bundle
- Keys cannot be extracted via reverse engineering
- Centralized key management
- Request validation and rate limiting possible

## Architecture

```
Mobile App → Backend Proxy → External APIs (OpenAI, Grok)
             (Port 3000)      (With secure API keys)
```

## Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **API Keys**: Valid keys for services you want to use (OpenAI, Grok, etc.)

## Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file with your actual API keys:**
   ```bash
   OPENAI_API_KEY=sk-proj-your-actual-openai-key
   ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key
   GROK_API_KEY=xai-your-actual-grok-key
   GOOGLE_API_KEY=your-actual-google-key
   ELEVENLABS_API_KEY=your-actual-elevenlabs-key
   PORT=3000
   NODE_ENV=development
   ```

## Running the Server

### Development Mode (with hot reload)
```bash
npm run dev
```

### Production Mode
```bash
# Build TypeScript to JavaScript
npm run build

# Start the server
npm start
```

### Verify Server is Running
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-01-22T..."
}
```

## API Endpoints

### Health Check
- **GET** `/health`
- Returns server status

### OpenAI Proxy

#### Chat Completions
- **POST** `/api/openai/chat`
- **Body:**
  ```json
  {
    "messages": [
      { "role": "user", "content": "Hello" }
    ],
    "temperature": 0.7,
    "maxTokens": 150,
    "model": "gpt-3.5-turbo"
  }
  ```
- **Response:**
  ```json
  {
    "content": "Hello! How can I help you?",
    "usage": {
      "promptTokens": 10,
      "completionTokens": 8,
      "totalTokens": 18
    }
  }
  ```

#### Audio Transcription
- **POST** `/api/openai/transcribe`
- **Content-Type:** `multipart/form-data`
- **Form Data:**
  - `file`: Audio file (mp3, mp4, mpeg, mpga, m4a, wav, webm)
  - `model`: (optional) Whisper model, defaults to "whisper-1"
  - `language`: (optional) ISO-639-1 language code
- **Response:**
  ```json
  {
    "text": "Transcribed audio content"
  }
  ```

### Grok Proxy

#### Chat Completions
- **POST** `/api/grok/chat`
- **Body:**
  ```json
  {
    "messages": [
      { "role": "user", "content": "Hello" }
    ],
    "temperature": 0.7,
    "maxTokens": 150,
    "model": "grok-beta"
  }
  ```
- **Response:**
  ```json
  {
    "content": "Response from Grok",
    "usage": {
      "promptTokens": 10,
      "completionTokens": 12,
      "totalTokens": 22
    }
  }
  ```

## Development

### Project Structure
```
backend/
├── src/
│   ├── server.ts          # Express app setup and entry point
│   ├── config/
│   │   └── env.ts         # Environment variable configuration
│   ├── middleware/
│   │   └── cors.ts        # CORS configuration
│   └── routes/
│       ├── openai.ts      # OpenAI proxy endpoints
│       └── grok.ts        # Grok proxy endpoints
├── dist/                  # Compiled JavaScript (generated)
├── .env                   # Environment variables (not in git)
├── .env.example           # Template for .env
├── package.json
└── tsconfig.json
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server (requires `npm run build` first)
- `npm run build` - Compile TypeScript to JavaScript
- `npm test` - Run test suite
- `npm run lint` - Lint TypeScript files
- `npm run typecheck` - Type check without building

### Adding New Proxy Endpoints

1. Create a new route file in `src/routes/`
2. Implement the proxy logic
3. Register the route in `src/server.ts`
4. Update this README with endpoint documentation

Example:
```typescript
// src/routes/newservice.ts
import { Router } from 'express';

const router = Router();

router.post('/action', async (req, res) => {
  try {
    // Validate request
    // Forward to external API
    // Return response
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process request' });
  }
});

export default router;
```

```typescript
// Add to src/server.ts
import newServiceRoutes from './routes/newservice';
app.use('/api/newservice', newServiceRoutes);
```

## Testing

### Run All Tests
```bash
npm test
```

### Test Specific Endpoint
```bash
# OpenAI Chat
curl -X POST http://localhost:3000/api/openai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'

# Grok Chat
curl -X POST http://localhost:3000/api/grok/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'
```

## Security Considerations

### API Key Storage
- **NEVER** commit `.env` file to git
- `.env` is already in `.gitignore`
- Use `.env.example` as a template without real keys

### Request Validation
- All endpoints validate required fields
- Invalid requests return 400 Bad Request
- Missing API keys return 500 Internal Server Error with safe error messages

### CORS Configuration
- Currently allows all origins for development
- **Production:** Update `src/middleware/cors.ts` to whitelist only your mobile app's domains

### Rate Limiting
- Consider adding rate limiting middleware for production
- Recommended: `express-rate-limit` package

### HTTPS
- Development uses HTTP (localhost only)
- **Production:** Always use HTTPS
- Use a reverse proxy (nginx) or cloud platform with SSL/TLS

## Troubleshooting

### Server won't start
- **Check port availability:** `lsof -i :3000`
- **Kill existing process:** `kill -9 $(lsof -t -i:3000)`
- **Check Node version:** `node --version` (must be >= 18.0.0)

### API key errors
- Verify `.env` file exists: `ls -la .env`
- Check key format in `.env` (no quotes, no spaces)
- Ensure API keys are valid and not expired

### CORS errors from mobile app
- Check CORS configuration in `src/middleware/cors.ts`
- Verify mobile app is using correct backend URL
- Check browser/app console for specific CORS error

### TypeScript compilation errors
- Run `npm run typecheck` to see detailed errors
- Ensure all dependencies are installed: `npm install`
- Check TypeScript version: `npx tsc --version`

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPENAI_API_KEY` | Yes* | OpenAI API key | `sk-proj-...` |
| `ANTHROPIC_API_KEY` | No | Anthropic Claude API key | `sk-ant-...` |
| `GROK_API_KEY` | Yes* | xAI Grok API key | `xai-...` |
| `GOOGLE_API_KEY` | No | Google AI API key | `AIza...` |
| `ELEVENLABS_API_KEY` | No | ElevenLabs API key | `...` |
| `PORT` | No | Server port (default: 3000) | `3000` |
| `NODE_ENV` | No | Environment mode | `development` or `production` |

*Required only if the mobile app uses that service

## License

ISC

## Support

For issues or questions, please refer to the main project documentation or create an issue in the repository.
