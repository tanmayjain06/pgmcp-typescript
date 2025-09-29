// src/utils/executor.ts
import { db } from '../services/database';

export async function runWithTimeout<T>(
  sql: string,
  params: any[] | undefined,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // node-postgres doesn’t support AbortSignal on Pool.query yet,
    // so emulate with a race on a manual promise rejection.
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout exceeded')), timeoutMs)
    );

    const queryPromise = db.query<any>(sql, params) as unknown as Promise<T>;

    return await Promise.race([queryPromise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}
