/**
 * Client-side commitment hashing.
 *
 * The raw profile (name, stack, years, hours) is serialized deterministically
 * and hashed with SHA-256 in the browser. Only the resulting 32-byte digest is
 * ever sent to the network — the raw data never leaves this device.
 */

/** Canonical byte-serialization of the profile fields (stable key order). */
export function canonicalProfileBytes(input: {
  name: string;
  stack: string[];
  years: number;
  hours: number;
}): Uint8Array {
  const canonical = JSON.stringify({
    name: input.name,
    stack: [...input.stack].sort(),
    years: input.years,
    hours: input.hours,
  });
  return new TextEncoder().encode(canonical);
}

/**
 * Hash the profile into a 32-byte commitment via WebCrypto SHA-256.
 * Returns a fresh Uint8Array of exactly 32 bytes.
 */
export async function hashProfileToCommitment(input: {
  name: string;
  stack: string[];
  years: number;
  hours: number;
}): Promise<Uint8Array> {
  const data = canonicalProfileBytes(input);
  const digest = await crypto.subtle.digest('SHA-256', data as BufferSource);
  return new Uint8Array(digest);
}

/** Hex-encode bytes for display (the commitment shown to the user is a digest, not raw data). */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
