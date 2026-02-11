/**
 * Verse Backend Server
 * 
 * Local-only Express server for Verse songwriting app.
 * Integrates with Ollama for AI collaboration.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { sessionRouter } from './routes/session';
import { timelineRouter } from './routes/timeline';
import { lyraRouter } from './routes/lyra';
import projectRouter from './routes/projects';
import { lyraEngine } from './modules/LyraEngine';
import { OLLAMA_CONFIG } from './config/ollama';
import { ensureProjectsDirectory } from './services/ProjectStorage';

// Server configuration
const PORT = process.env.PORT || 3001;
const app = express();

// =======================
// Middleware
// =======================

// CORS - Allow local frontend connections
app.use(cors({
  origin: [
    'http://localhost:5173',  // Vite dev server
    'http://localhost:3000',  // Alternative dev port
    'http://localhost:8080',  // Vite alternative port
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8080',
    'tauri://localhost',
    'http://tauri.localhost',
  ],
  credentials: true,
}));

// JSON body parser
app.use(express.json({ limit: '10mb' }));

// Request logging (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// =======================
// Routes
// =======================

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    message: 'Verse backend is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/session', sessionRouter);
app.use('/api/timeline', timelineRouter);
app.use('/api/lyra', lyraRouter);
app.use('/api/projects', projectRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Endpoint not found' 
  });
});

// Global error handler
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server] Unhandled error:', error);
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV !== 'production' ? error.message : undefined,
  });
});

// =======================
// Startup
// =======================

/**
 * Performs startup checks before server starts
 */
async function performStartupChecks(): Promise<void> {
  console.log('\n=================================');
  console.log('Verse Backend - Startup Configuration');
  console.log('=================================\n');
  
  // Ensure projects directory exists
  await ensureProjectsDirectory();
  console.log('✓ Projects directory initialized');
  
  // Log active configuration
  console.log('Using Ollama model:', OLLAMA_CONFIG.model);
  console.log('Ollama endpoint:', OLLAMA_CONFIG.baseUrl);
  console.log('Streaming:', OLLAMA_CONFIG.stream ? 'enabled' : 'disabled');
  console.log('');
  
  // Check Ollama connection (but never try to pull/download)
  console.log('Checking Ollama connection...');
  const ollamaConnected = await lyraEngine.testConnection();
  
  if (!ollamaConnected) {
    console.error('❌ Cannot connect to Ollama');
    console.error(`   Expected at: ${OLLAMA_CONFIG.baseUrl}`);
    console.error('\n   Please ensure Ollama is running:');
    console.error('   - macOS/Linux: Check if ollama service is running');
    console.error('   - Or start manually: ollama serve\n');
    console.warn('⚠️  Starting server anyway, but Lyra will not work until Ollama is available.\n');
    return;
  }
  
  console.log('✓ Ollama is running');
  console.log(`✓ Backend will use local model: ${OLLAMA_CONFIG.model}`);
  console.log('\n✅ Configuration complete - Lyra is ready!\n');
}

/**
 * Starts the server
 */
async function startServer(): Promise<void> {
  try {
    // Perform startup checks
    await performStartupChecks();
    
    // Start listening
    app.listen(PORT, () => {
      console.log('=================================');
      console.log('Verse Backend - Server Started');
      console.log('=================================');
      console.log(`Port: ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Lyra health: http://localhost:${PORT}/api/lyra/health`);
      console.log('\n📝 Backend is ready for songwriting!\n');
      console.log('Key Features:');
      console.log('  • Project persistence (save/load songs)');
      console.log('  • Session-based AI memory (isolated per project)');
      console.log('  • Local-only (no cloud)');
      console.log('  • Proposal-based AI (never auto-edits)');
      console.log('  • Full creative freedom\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// =======================
// Graceful Shutdown
// =======================

function gracefulShutdown(signal: string): void {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// =======================
// Start
// =======================

startServer();
