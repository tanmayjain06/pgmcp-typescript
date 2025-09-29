// src/utils/validation.ts
export type SqlSafetyCheck = {
  ok: boolean;
  reason?: string;
};

const WRITE_PATTERNS = [
  /\binsert\b/gi,
  /\bupdate\b/gi,
  /\bdelete\b/gi,
  /\bdrop\b/gi,
  /\balter\b/gi,
  /\btruncate\b/gi,
  /\bcreate\b/gi,
  /\bgrant\b/gi,
  /\brevoke\b/gi,
  /\bvaccum\b/gi,  // common misspelling guard
  /\bvacuum\b/gi,
  /\banalyze\b/gi,
  /\bcall\b/gi,
  /\bdo\b/gi,
  /\brefresh materialized view\b/gi
];

const MULTI_STMT = /;(?=(?:[^'"]|'[^']*'|"[^"]*")*$)/g; // semicolons not inside quotes

export function ensureReadOnly(sql: string): SqlSafetyCheck {
  const normalized = sql.trim();
  if (!normalized) return { ok: false, reason: 'Empty SQL' };

  // Disallow multiple statements
  if (MULTI_STMT.test(normalized)) {
    return { ok: false, reason: 'Multiple statements are not allowed' };
  }

  // Allow EXPLAIN/EXPLAIN ANALYZE only if underlying is SELECT
  const explainMatch = normalized.match(/^\s*explain(\s+analyze)?\s+(.*)$/i);
  if (explainMatch) {
    const inner = explainMatch[2] || '';
    if (!/^\s*select\b/i.test(inner)) {
      return { ok: false, reason: 'Only EXPLAIN SELECT is allowed' };
    }
    return { ok: true };
  }

  // Must be SELECT or WITH (CTE) leading to SELECT
  const isSelect =
    /^\s*select\b/i.test(normalized) ||
    /^\s*with\b/i.test(normalized);

  if (!isSelect) {
    return { ok: false, reason: 'Only SELECT/CTE queries are permitted' };
  }

  // Screen for write/DDL tokens anywhere
  for (const p of WRITE_PATTERNS) {
    if (p.test(normalized)) {
      return { ok: false, reason: `Statement not allowed: ${p.source.replace(/\\b/gi, '')}` };
    }
  }

  return { ok: true };
}
