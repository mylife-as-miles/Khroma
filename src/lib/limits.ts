import { runQuery } from './clients';
import type { RowDataPacket } from 'mysql2';

const isLocal = process.env.NODE_ENV !== "production";
const dailyLimit = 50; // 50 messages per day
const windowSec = 24 * 60 * 60; // 24 hours

async function getUsage(userFingerPrint: string): Promise<{ count: number, oldestTimestamp: Date | null }> {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = new Date((now - windowSec) * 1000);

    const [rows] = await runQuery<RowDataPacket[]>(
        'SELECT COUNT(*) as count, MIN(timestamp) as oldestTimestamp FROM rate_limits WHERE id = ? AND timestamp >= ?',
        [userFingerPrint, windowStart]
    );

    const usage = rows[0] as { count: number, oldestTimestamp: string | null };

    return {
        count: Number(usage.count) || 0,
        oldestTimestamp: usage.oldestTimestamp ? new Date(usage.oldestTimestamp) : null
    };
}

export async function getRemainingMessages(userFingerPrint: string): Promise<{ remaining: number; reset: number }> {
    // In local, always allow
    if (isLocal) return { remaining: dailyLimit, reset: Date.now() + windowSec * 1000 };
    try {
        const { count, oldestTimestamp } = await getUsage(userFingerPrint);
        const remaining = dailyLimit - count;
        const reset = oldestTimestamp ? oldestTimestamp.getTime() + windowSec * 1000 : Date.now() + windowSec * 1000;
        return { remaining: remaining > 0 ? remaining : 0, reset };
    } catch (e) {
        // Graceful fallback if DB is not configured or temporarily unavailable
        return { remaining: dailyLimit, reset: Date.now() + windowSec * 1000 };
    }
}

export async function limitMessages(userFingerPrint: string): Promise<void> {
    if (isLocal) return;
    try {
        const { count } = await getUsage(userFingerPrint);
        if (count >= dailyLimit) {
            throw new Error("Too many messages");
        }
        await runQuery('INSERT INTO rate_limits (id, timestamp) VALUES (?, NOW())', [userFingerPrint]);
    } catch (e) {
        // If DB is unavailable, do not hard fail the request; allow and rely on upstream rate limits
        return;
    }
}
