import crypto from 'node:crypto';

// Standard RFC 4648 Base32 alphabet
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32ToBuffer(base32Str: string): Buffer {
  const cleaned = base32Str.toUpperCase().replace(/=+$/, '').replace(/[\s-]/g, '');
  let bits = '';
  let hex = '';

  for (let i = 0; i < cleaned.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleaned.charAt(i));
    if (val === -1) {
      throw new Error(`Invalid Base32 character '${cleaned.charAt(i)}' in TOTP secret key.`);
    }
    bits += val.toString(2).padStart(5, '0');
  }

  for (let i = 0; i + 8 <= bits.length; i += 8) {
    const chunk = bits.substring(i, i + 8);
    hex += parseInt(chunk, 2).toString(16).padStart(2, '0');
  }

  return Buffer.from(hex, 'hex');
}

/**
 * Pure RFC 6238 Time-based One-Time Password (TOTP) generator
 * HMAC-SHA1 algorithm, 30-second time step, 6-digit output.
 * Matches Google Authenticator, Microsoft Authenticator, Ente Auth & Zerodha backend.
 */
export function generateTOTP(secretBase32: string): string {
  const key = base32ToBuffer(secretBase32);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / 30);

  // 8-byte big-endian buffer for counter (RFC 4226)
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(counter), 0);

  // HMAC-SHA1
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(buffer);
  const digest = hmac.digest();

  // Dynamic truncation (RFC 4226 Section 5.4)
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  // 6-digit zero-padded code
  return (binary % 1000000).toString().padStart(6, '0');
}
