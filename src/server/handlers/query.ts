// src/server/handlers/query.ts
import { Request, Response } from 'express';
import { runWithTimeout } from '../../utils/executor';
import { ensureReadOnly } from '../../utils/validation';
import { config } from '../../utils/config';

export async function handleQuery(req: Request, res: Response) {
  try {
    const sql = String(req.body?.sql || req.query?.sql || '').trim();
    const params = (req.body?.params as any[]) || [];

    if (!sql) {
      return res.status(400).json({ success: false, error: 'Missing sql' });
    }

    const safety = ensureReadOnly(sql);
    if (!safety.ok) {
      return res.status(400).json({ success: false, error: `Blocked: ${safety.reason}` });
    }

    const timeout = config.query.timeout || 30000;
    const result = await runWithTimeout<any>(sql, params, timeout);

    return res.json({
      success: true,
      rowCount: (result as any).rowCount ?? (result as any).rows?.length ?? 0,
      rows: (result as any).rows ?? [],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ success: false, error: msg });
  }
}
