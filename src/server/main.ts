import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from '../utils/config';
import { db } from '../services/database';
import { schemaService } from '../services/schema';
import { enforceReadOnly } from './middleware/readOnly';
import { handleQuery } from './handlers/query'
import { handleAsk } from './handlers/ask';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.post('/query', enforceReadOnly, handleQuery);
app.post('/ask', handleAsk);

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbConnected = db.isConnected();
  
  res.json({
    status: dbConnected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: {
      connected: dbConnected
    }
  });
});

// Schema endpoint for testing
app.get('/schema', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const schema = await schemaService.getDatabaseSchema(forceRefresh);
    
    res.json({
      success: true,
      data: schema,
      tablesCount: schema.tables.length
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Initialize database connection and start server
async function startServer() {
  try {
    console.log('🚀 Starting PGMCP Server...');
    
    // Test database connection
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      console.warn('⚠️  Database connection failed, but server will continue');
    }
    
    // Start server
    const port = config.server.port;
    app.listen(port, () => {
      console.log(`🚀 PGMCP Server running on port ${port}`);
      console.log(`📊 Environment: ${config.server.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${port}/health`);
      console.log(`🗂️  Schema endpoint: http://localhost:${port}/schema`);
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to start server:', errorMessage);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await db.close();
  process.exit(0);
});

// Start the server
startServer();
