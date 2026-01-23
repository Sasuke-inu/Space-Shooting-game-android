import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsMiddleware } from './middleware/cors';
import { config } from './config/env';
import openaiRoutes from './routes/openai';
import grokRoutes from './routes/grok';

const app = express();

// Security middleware
app.use(helmet());
app.use(corsMiddleware);

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/openai', openaiRoutes);
app.use('/api/grok', grokRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 OpenAI proxy: http://localhost:${PORT}/api/openai/*`);
  console.log(`🤖 Grok proxy: http://localhost:${PORT}/api/grok/*`);
});

export default app;
