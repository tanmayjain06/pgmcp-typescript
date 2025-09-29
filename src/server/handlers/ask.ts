// src/server/handlers/ask.ts
import { Request, Response } from 'express';
import { schemaService } from '../../services/schema';
import { aiService } from '../../services/ai';
import { summarizeSchema, buildSqlPrompt } from '../../utils/prompt';
import { extractSqlFromText } from '../../utils/sql';
import { ensureReadOnly } from '../../utils/validation';
import { runWithTimeout } from '../../utils/executor';
import { config } from '../../utils/config';

export async function handleAsk(req: Request, res: Response) {
  try {
    const question = String(req.body?.question || req.query?.q || '').trim();
    const dryRun = req.body?.dryRun === true || req.query?.dryRun === 'true';
    if (!question) return res.status(400).json({ success: false, error: 'Missing question' });

    // Load schema summary
    const schema = await schemaService.getDatabaseSchema(false);
    const schemaText = summarizeSchema(schema, 12, 14);

    // Build prompt and call model
    const prompt = buildSqlPrompt(question, schemaText);
    const raw = await aiService.generateSql(prompt);
    const sql = extractSqlFromText(raw);

    // Safety gate
    const safe = ensureReadOnly(sql);
    if (!safe.ok) return res.status(400).json({ success: false, error: `Blocked: ${safe.reason}`, sql });

    if (dryRun) return res.json({ success: true, sql });

    // Execute with timeout
    const timeout = config.query.timeout || 30000;
    const result = await runWithTimeout(sql, [], timeout);

    return res.json({
      success: true,
      sql,
      rowCount: (result as any).rowCount ?? (result as any).rows?.length ?? 0,
      rows: (result as any).rows ?? []
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ success: false, error: msg });
  }
}
