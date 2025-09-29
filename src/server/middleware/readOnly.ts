// src/server/middleware/readOnly.ts
import { Request, Response, NextFunction } from 'express';
import { ensureReadOnly } from '../../utils/validation';

export function enforceReadOnly(req: Request, res: Response, next: NextFunction) {
  const sql: string | undefined = (req as any).resolvedSql || req.body?.sql || req.query?.sql as string | undefined;

  if (!sql) return next(); // nothing to validate here

  const check = ensureReadOnly(sql);
  if (!check.ok) {
    return res.status(400).json({
      success: false,
      error: `Blocked by read-only guard: ${check.reason}`
    });
  }
  next();
}
