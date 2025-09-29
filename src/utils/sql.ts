// src/utils/sql.ts
export function extractSqlFromText(text: string): string {
  // Prefer fenced `````` or `````` blocks
  const fenced = text.match(/``````/i) || text.match(/``````/i);
  if (fenced && fenced[1]) {
    return fenced[1].trim().replace(/;+\s*$/,''); // strip trailing semicolons
  }
  // Fallback: find first SELECT... up to optional trailing semicolon
  const sel = text.match(/select[\s\S]*$/i);
  if (sel) return sel[0].trim().replace(/;+\s*$/,'');
  return text.trim();
}
