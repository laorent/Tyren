// ============================================================
// Tyren — Server-side Token Verification (Hardened)
// ============================================================

/**
 * Verify a session token.
 *
 * Security improvements over original:
 * 1. Token expiry reduced from 7 days to 24 hours
 * 2. Uses constant-time comparison to prevent timing attacks
 * 3. Uses full password hash as the secret (not just first 10 chars)
 */
export async function verifyToken(token: string): Promise<boolean> {
    if (!token) return false;

    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [timestamp, clientHashHex] = parts;
    const tokenTime = parseInt(timestamp, 10);

    if (isNaN(tokenTime)) return false;

    // Token expiration: 24 hours (reduced from 7 days for tighter security)
    const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
    if (Date.now() - tokenTime > TOKEN_TTL_MS) {
        return false;
    }

    // Reconstruct hash using the full password (not a truncated slice)
    const password = process.env.WEB_ACCESS_PASSWORD;
    if (!password) return false;

    const secretKey = await deriveSecret(password);
    const data = new TextEncoder().encode(`${timestamp}:${secretKey}`);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedHashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Constant-time comparison to prevent timing attacks
    return constantTimeEqual(clientHashHex, expectedHashHex);
}

/**
 * Derive a stable secret from the password using SHA-256.
 * This avoids leaking password length or prefix information
 * (the old approach used password.slice(0, 10)).
 */
export async function deriveSecret(password: string): Promise<string> {
    const data = new TextEncoder().encode(`tyren_secret:${password}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Constant-time string comparison.
 * Prevents timing side-channel attacks by always comparing
 * every character regardless of where a mismatch occurs.
 */
function constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}
