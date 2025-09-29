// src/services/database.ts
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from '../utils/config';

class DatabaseService {
  private pool: Pool;
  private connected = false;

  constructor() {
    this.pool = this.createPool();
    this.setupPoolEvents();
  }

  private createPool(): Pool {
    let connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is required for Neon connection');
    }

    // Optional: remove channel_binding if client/lib setup struggles with it during handshake
    if (connectionString.includes('channel_binding=')) {
      const before = connectionString;
      connectionString = connectionString
        .replace(/[?&]channel_binding=[^&]+/i, '')
        .replace(/[?&]$/, '');
      if (before !== connectionString) {
        console.log('ℹ️  Removed channel_binding from DATABASE_URL for compatibility');
      }
    }

    // Ensure TLS is enforced in URL as well
    if (!/sslmode=/i.test(connectionString)) {
      connectionString += (connectionString.includes('?') ? '&' : '?') + 'sslmode=require';
    }

    console.log('🔗 Using Neon DATABASE_URL with SSL');
    return new Pool({
      connectionString,
      ssl: true,                    // enable TLS per node-postgres guidance
      max: Math.min(config.database.max || 20, 20),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000, // give time for TLS handshake to Neon
    });
  }

  private setupPoolEvents(): void {
    this.pool.on('connect', () => {
      console.log('📦 DB client connected (SSL)');
      this.connected = true;
    });
    this.pool.on('error', (err) => {
      console.error('❌ DB pool error:', err.message);
      this.connected = false;
    });
  }

  private async tryConnectOnce(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.tryConnectOnce();
      this.connected = true;
      console.log('✅ DB OK: initial connect');
      return true;
    } catch (e1) {
      const msg1 = e1 instanceof Error ? e1.message : String(e1);
      console.warn('⚠️  First connect failed, retrying once:', msg1);
      try {
        await this.tryConnectOnce();
        this.connected = true;
        console.log('✅ DB OK: retry connect');
        return true;
      } catch (e2) {
        const msg2 = e2 instanceof Error ? e2.message : String(e2);
        console.error('❌ DB test failed after retry:', msg2);
        this.connected = false;
        return false;
      }
    }
  }

  // Fix: constrain generic to QueryResultRow so it satisfies pg's types
  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  isConnected(): boolean {
    return this.connected;
  }

  async close(): Promise<void> {
    await this.pool.end();
    this.connected = false;
  }
}

export const db = new DatabaseService();
