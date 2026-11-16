// Utilitas keamanan autentikasi: hashing SHA-256, verifikasi PIN/password,
// rate limiting percobaan login, dan deteksi PIN bawaan.

export const DEFAULT_TEACHER_PIN = "123456";
export const DEFAULT_USER_SALT = "mysch-v1";
export const SUPER_ADMIN_SALT = "mysch-super-v1";
export const SUPER_ADMIN_DEFAULT_HASH =
  "sha256:f89c8e26507cc80cee27cad5d202e432ce432a1ad3000a08706d2ee40135d228";

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_SECONDS = 30;

const DEFAULT_PIN_WARNING_KEY = "jg_default_pin_warning";
const LOCKOUT_KEY_PREFIX = "jg_auth_lock_";

// Fallback SHA-256 murni JS jika Web Crypto (crypto.subtle) tidak tersedia (mis. akses HTTP non-localhost)
function sha256Fallback(ascii: string): string {
  const rightRotate = (value: number, amount: number) =>
    (value >>> amount) | (value << (32 - amount));

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = "";

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  let padded = ascii + "\x80";
  while ((padded.length % 64) - 56) padded += "\x00";
  for (let i = 0; i < padded.length; i++) {
    const j = padded.charCodeAt(i);
    if (j >> 8) return "";
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash.unshift((temp1 + temp2) | 0);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

export function isHashedSecret(stored?: string | null): boolean {
  return Boolean(stored && stored.startsWith("sha256:"));
}

export async function hashSecret(
  plain: string,
  salt: string = DEFAULT_USER_SALT
): Promise<string> {
  const input = `${salt}:${plain}`;
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const bytes = new TextEncoder().encode(input);
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `sha256:${hex}`;
  }
  const utf8 = unescape(encodeURIComponent(input));
  return `sha256:${sha256Fallback(utf8)}`;
}

export async function verifySecret(
  plain: string,
  stored: string,
  salt: string = DEFAULT_USER_SALT
): Promise<boolean> {
  if (!stored) return false;
  if (isHashedSecret(stored)) {
    const hashed = await hashSecret(plain, salt);
    return hashed === stored;
  }
  // Kompatibilitas mundur untuk PIN plaintext lama sebelum auto-upgrade
  return plain === stored;
}

// ==========================================
// RATE LIMITER PERCOBAAN LOGIN
// ==========================================
interface LockState {
  attempts: number;
  lockedUntil: number;
}

function readLockState(scope: string): LockState {
  if (typeof window === "undefined") return { attempts: 0, lockedUntil: 0 };
  try {
    const raw = localStorage.getItem(`${LOCKOUT_KEY_PREFIX}${scope}`);
    if (!raw) return { attempts: 0, lockedUntil: 0 };
    return JSON.parse(raw) as LockState;
  } catch {
    return { attempts: 0, lockedUntil: 0 };
  }
}

function writeLockState(scope: string, state: LockState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${LOCKOUT_KEY_PREFIX}${scope}`, JSON.stringify(state));
  } catch {
    // Abaikan jika localStorage tidak tersedia
  }
}

export function getLockoutRemainingSeconds(scope: string): number {
  const state = readLockState(scope);
  if (!state.lockedUntil) return 0;
  const diffMs = state.lockedUntil - Date.now();
  if (diffMs <= 0) {
    writeLockState(scope, { attempts: 0, lockedUntil: 0 });
    return 0;
  }
  return Math.ceil(diffMs / 1000);
}

export function recordFailedAttempt(scope: string): {
  locked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
} {
  const current = readLockState(scope);
  const activeLock = getLockoutRemainingSeconds(scope);
  if (activeLock > 0) {
    return { locked: true, remainingSeconds: activeLock, attemptsLeft: 0 };
  }

  const nextAttempts = current.attempts + 1;
  if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
    const lockedUntil = Date.now() + LOCKOUT_SECONDS * 1000;
    writeLockState(scope, { attempts: nextAttempts, lockedUntil });
    return { locked: true, remainingSeconds: LOCKOUT_SECONDS, attemptsLeft: 0 };
  }

  writeLockState(scope, { attempts: nextAttempts, lockedUntil: 0 });
  return {
    locked: false,
    remainingSeconds: 0,
    attemptsLeft: MAX_LOGIN_ATTEMPTS - nextAttempts,
  };
}

export function resetFailedAttempts(scope: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${LOCKOUT_KEY_PREFIX}${scope}`);
  } catch {
    // Abaikan
  }
}

// ==========================================
// PENANDA PIN / PASSWORD BAWAAN
// ==========================================
export function setDefaultPinWarning(active: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (active) {
      localStorage.setItem(DEFAULT_PIN_WARNING_KEY, "1");
    } else {
      localStorage.removeItem(DEFAULT_PIN_WARNING_KEY);
    }
  } catch {
    // Abaikan
  }
}

export function hasDefaultPinWarning(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(DEFAULT_PIN_WARNING_KEY) === "1";
  } catch {
    return false;
  }
}
