import { db } from './database';
import { DatabaseSchema, TableInfo, ColumnInfo, IndexInfo, ForeignKeyInfo, SchemaCache } from '../types';
import { config } from '../utils/config';

class SchemaService {
  private cache: SchemaCache | null = null;

  private isValidCache(): boolean {
    if (!this.cache) return false;
    
    const now = Date.now();
    const cacheAge = now - this.cache.lastUpdated.getTime();
    return cacheAge < config.cache.schemaCacheTTL;
  }

  async getDatabaseSchema(forceRefresh: boolean = false): Promise<DatabaseSchema> {
    // Return cached schema if valid and not forcing refresh
    if (!forceRefresh && this.isValidCache()) {
      console.log('📋 Using cached database schema');
      return this.cache!.schema;
    }

    console.log('🔄 Loading database schema...');
    const schema = await this.loadSchemaFromDatabase();
    
    // Update cache
    this.cache = {
      schema,
      lastUpdated: new Date(),
      ttl: config.cache.schemaCacheTTL
    };

    console.log(`✅ Schema loaded: ${schema.tables.length} tables found`);
    return schema;
  }

  private async loadSchemaFromDatabase(): Promise<DatabaseSchema> {
    const tables = await this.loadTables();
    
    // Load additional details for each table
    for (const table of tables) {
      table.columns = await this.loadColumns(table.schema, table.name);
      table.indexes = await this.loadIndexes(table.schema, table.name);
      table.foreignKeys = await this.loadForeignKeys(table.schema, table.name);
      table.rowCount = await this.getTableRowCount(table.schema, table.name);
    }

    return {
      tables,
      lastUpdated: new Date()
    };
  }

  private async loadTables(): Promise<TableInfo[]> {
    const query = `
      SELECT 
        table_schema as schema,
        table_name as name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
        AND table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name;
    `;

    const result = await db.query(query);
    
    return result.rows.map(row => ({
      name: row.name,
      schema: row.schema,
      columns: [],
      indexes: [],
      foreignKeys: []
    }));
  }

  private async loadColumns(schema: string, tableName: string): Promise<ColumnInfo[]> {
    const query = `
      SELECT 
        c.column_name as name,
        c.data_type as type,
        c.is_nullable = 'YES' as nullable,
        c.column_default as default_value,
        c.character_maximum_length as max_length,
        c.numeric_precision as precision,
        c.numeric_scale as scale,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku 
          ON tc.constraint_name = ku.constraint_name
        WHERE tc.table_schema = $1 
          AND tc.table_name = $2
          AND tc.constraint_type = 'PRIMARY KEY'
      ) pk ON c.column_name = pk.column_name
      WHERE c.table_schema = $1 AND c.table_name = $2
      ORDER BY c.ordinal_position;
    `;

    const result = await db.query(query, [schema, tableName]);
    
    return result.rows.map(row => ({
      name: row.name,
      type: row.type,
      nullable: row.nullable,
      default: row.default_value,
      isPrimaryKey: row.is_primary_key,
      maxLength: row.max_length,
      precision: row.precision,
      scale: row.scale
    }));
  }

  private async loadIndexes(schema: string, tableName: string): Promise<IndexInfo[]> {
    const query = `
      SELECT 
        i.indexname as name,
        i.indexdef as definition,
        ind.indisunique as unique
      FROM pg_indexes i
      JOIN pg_class c ON c.relname = i.tablename
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_index ind ON ind.indexrelid = (
        SELECT oid FROM pg_class WHERE relname = i.indexname
      )
      WHERE n.nspname = $1 AND i.tablename = $2;
    `;

    const result = await db.query(query, [schema, tableName]);
    
    return result.rows.map(row => {
      // Parse column names from index definition
      const columns = this.parseIndexColumns(row.definition);
      
      return {
        name: row.name,
        columns,
        unique: row.unique,
        type: row.unique ? 'UNIQUE' : 'INDEX'
      };
    });
  }

  private async loadForeignKeys(schema: string, tableName: string): Promise<ForeignKeyInfo[]> {
    const query = `
      SELECT 
        kcu.column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column,
        tc.constraint_name
      FROM information_schema.table_constraints tc 
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = $1 
        AND tc.table_name = $2;
    `;

    const result = await db.query(query, [schema, tableName]);
    
    return result.rows.map(row => ({
      columnName: row.column_name,
      referencedTable: row.referenced_table,
      referencedColumn: row.referenced_column,
      constraintName: row.constraint_name
    }));
  }

  private async getTableRowCount(schema: string, tableName: string): Promise<number> {
    try {
      const query = `SELECT COUNT(*) as count FROM "${schema}"."${tableName}"`;
      const result = await db.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`⚠️  Could not get row count for ${schema}.${tableName}:`, errorMessage);
      return 0;
    }
  }

  private parseIndexColumns(indexDef: string): string[] {
    // Simple parser for index definition
    // Example: "CREATE INDEX idx_name ON table_name (col1, col2)"
    const match = indexDef.match(/\(([^)]+)\)/);
    if (!match) return [];
    
    return match[1]
      .split(',')
      .map(col => col.trim().replace(/"/g, ''));
  }

  clearCache(): void {
    this.cache = null;
    console.log('🗑️  Schema cache cleared');
  }
}

// Export singleton instance
export const schemaService = new SchemaService();
