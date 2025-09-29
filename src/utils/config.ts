import dotenv from 'dotenv';
import { AppConfig } from '../types';

dotenv.config();

export const config: AppConfig = {
  server: {
    port: parseInt(process.env.PORT || '8080'),
    nodeEnv: process.env.NODE_ENV || 'development',
    bearerToken: process.env.BEARER_TOKEN,
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  },
  cache: {
    schemaCacheTTL: parseInt(process.env.SCHEMA_CACHE_TTL || '300000'),
  },
  query: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '100'),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '1000'),
    timeout: parseInt(process.env.QUERY_TIMEOUT || '30000'),
  },
};

// Validate required configuration
if (!config.gemini.apiKey) {
  console.warn('Warning: GEMINI_API_KEY is not set');
}
