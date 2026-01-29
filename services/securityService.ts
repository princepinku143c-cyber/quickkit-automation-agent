
import { db } from './storage';

const REPLAY_TOLERANCE_MS = 5 * 60 * 1000; // 5 Minutes

// Polyfill for Node vs Browser Crypto
const getCryptoSubtle = () => {
    if (typeof crypto !== 'undefined' && crypto.subtle) return crypto.subtle;
    throw new Error("Crypto module not available.");
};

export const verifyHmacSignature = async (
    payload: string, 
    secret: string, 
    headerSignature: string,
    timestamp?: number
): Promise<{ valid: boolean; reason?: string }> => {
    if (!secret || !headerSignature) return { valid: false, reason: 'Missing secret or signature' };

    if (timestamp) {
        const now = Date.now();
        if (Math.abs(now - timestamp) > REPLAY_TOLERANCE_MS) {
            return { valid: false, reason: 'Request expired (Replay Protection)' };
        }
    }

    let cleanSignature = headerSignature;
    if (headerSignature.includes('=')) {
        cleanSignature = headerSignature.split('=')[1];
    }

    try {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const msgData = encoder.encode(payload);
        const subtle = getCryptoSubtle();

        const key = await subtle.importKey(
            'raw', keyData, { name: 'HMAC', hash: { name: 'SHA-256' } },
            false, ['verify']
        );

        const signatureBytes = new Uint8Array(
            (cleanSignature.match(/[\da-f]{2}/gi) || []).map(h => parseInt(h, 16))
        );

        const isValid = await subtle.verify('HMAC', key, signatureBytes, msgData);
        return { valid: isValid };

    } catch (e: any) {
        console.error("Security Error:", e);
        return { valid: false, reason: `Crypto Failure: ${e.message}` };
    }
};

export const checkRateLimit = async (
    identifier: string, 
    limit: number, 
    windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; reset: number }> => {
    if (!limit || limit <= 0) return { allowed: true, remaining: 999, reset: 0 };

    const key = `rl:${identifier}`;
    const count = await db.incr(key, windowSeconds);
    
    if (count > limit) {
        return { allowed: false, remaining: 0, reset: Date.now() + (windowSeconds * 1000) };
    }

    return { 
        allowed: true, 
        remaining: limit - count, 
        reset: Date.now() + (windowSeconds * 1000) 
    };
};
