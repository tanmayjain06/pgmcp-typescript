export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  bearerToken?: string;
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

export interface AppConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  gemini: GeminiConfig;
  cache: {
    schemaCacheTTL: number;
  };
  query: {
    defaultPageSize: number;
    maxPageSize: number;
    timeout: number;
  };
}

export interface QueryRequest {
  query: string;
  format?: 'json' | 'csv' | 'table';
  pageSize?: number;
  page?: number;
}

export interface QueryResponse {
  success: boolean;
  data?: any[];
  error?: string;
  sql?: string;
  totalRows?: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
}

export interface DatabaseSchema {
  tables: TableInfo[];
  lastUpdated: Date;
}

export interface TableInfo {
  name: string;
  schema: string;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  foreignKeys: ForeignKeyInfo[];
  rowCount?: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  isPrimaryKey: boolean;
  maxLength?: number;
  precision?: number;
  scale?: number;
}

export interface IndexInfo {
  name: string;
  columns: string[];
  unique: boolean;
  type: string;
}

export interface ForeignKeyInfo {
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
  constraintName: string;
}

export interface SchemaCache {
  schema: DatabaseSchema;
  lastUpdated: Date;
  ttl: number;
}
