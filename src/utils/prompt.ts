// src/utils/prompt.ts
import type { DatabaseSchema } from '../types';

function renderColType(type: string, maxLength?: number | null, precision?: number | null, scale?: number | null): string {
  const t = type.toLowerCase();
  if (t === 'character varying' && maxLength) return `varchar(${maxLength})`;
  if (t === 'numeric' && precision != null && scale != null) return `numeric(${precision},${scale})`;
  return type;
}

export function summarizeSchema(schema: DatabaseSchema, maxTables = 12, maxCols = 14): string {
  const lines: string[] = [];
  const tables = Array.isArray(schema?.tables) ? schema.tables : [];
  for (const t of tables.slice(0, maxTables)) {
    const cols = Array.isArray(t.columns) ? t.columns : [];
    const parts = cols.slice(0, maxCols).map(c => {
      const ty = renderColType(c.type, c.maxLength ?? null, c.precision ?? null, c.scale ?? null);
      return `${c.name}:${ty}`;
    });
    lines.push(`${t.schema}.${t.name}(${parts.join(', ')})`);
  }
  return lines.join('\n');
}

export function buildSqlPrompt(question: string, schemaText: string): string {
  return [
    'You are a SQL generator for PostgreSQL.',
    'Output exactly one statement.',
    'Only SELECT or WITH that culminates in a SELECT is allowed.',
    'Do not generate DDL or DML (INSERT, UPDATE, DELETE, ALTER, DROP, TRUNCATE, CREATE, GRANT, REVOKE, VACUUM, ANALYZE, CALL, DO).',
    'Use only tables and columns present in the schema.',
    'Prefer schema-qualified names like app.users.',
    'Return only the SQL as plain text without code fences or comments.',
    'Schema:',
    schemaText,
    'Question:',
    question
  ].join('\n');
}
