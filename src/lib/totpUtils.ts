// Utilitas TOTP (RFC 6238) untuk Google Authenticator
// Menggunakan Web Crypto HMAC-SHA1 dengan fallback JS murni agar tetap jalan di HTTP non-localhost.

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateBase32Secret(byteLength = 20): string {
  const bytes = new Uint8Array(byteLength);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < byteLength; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32ToBytes(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

// Fallback SHA-1 & HMAC-SHA1 murni JS jika crypto.subtle tidak tersedia
function sha1Bytes(data: Uint8Array): Uint8Array {
  const rotl = (n: number, s: number) => (n << s) | (n >>> (32 - s));
  const msgLen = data.length;
  const words: number[] = [];
  for (let i = 0; i < msgLen; i++) {
    words[i >> 2] = (words[i >> 2] || 0) | (data[i] << (24 - (i % 4) * 8));
  }
  words[msgLen >> 2] = (words[msgLen >> 2] || 0) | (0x80 << (24 - (msgLen % 4) * 8));
  const totalWords = (((msgLen + 8) >> 6) + 1) * 16;
  while (words.length < totalWords) words.push(0);
  words[totalWords - 2] = Math.floor((msgLen * 8) / 0x100000000);
  words[totalWords - 1] = (msgLen * 8) >>> 0;

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const w = new Array<number>(80);
  for (let i = 0; i < words.length; i += 16) {
    for (let t = 0; t < 16; t++) w[t] = words[i + t] | 0;
    for (let t = 16; t < 80; t++) {
      w[t] = rotl(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let t = 0; t < 80; t++) {
      let f = 0;
      let k = 0;
      if (t < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (t < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (t < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const temp = (rotl(a, 5) + f + e + k + w[t]) | 0;
      e = d;
      d = c;
      c = rotl(b, 30);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
  }

  const out = new Uint8Array(20);
  const hs = [h0, h1, h2, h3, h4];
  for (let i = 0; i < 5; i++) {
    out[i * 4] = (hs[i] >>> 24) & 0xff;
    out[i * 4 + 1] = (hs[i] >>> 16) & 0xff;
    out[i * 4 + 2] = (hs[i] >>> 8) & 0xff;
    out[i * 4 + 3] = hs[i] & 0xff;
  }
  return out;
}

function hmacSha1Fallback(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64;
  const k = key.length > blockSize ? sha1Bytes(key) : key;
  const paddedKey = new Uint8Array(blockSize);
  paddedKey.set(k);

  const oKeyPad = new Uint8Array(blockSize + 20);
  const iKeyPad = new Uint8Array(blockSize + message.length);

  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = paddedKey[i] ^ 0x5c;
    iKeyPad[i] = paddedKey[i] ^ 0x36;
  }
  iKeyPad.set(message, blockSize);
  const innerHash = sha1Bytes(iKeyPad);
  oKeyPad.set(innerHash, blockSize);
  return sha1Bytes(oKeyPad);
}

async function hmacSha1(keyBytes: Uint8Array, msgBytes: Uint8Array): Promise<Uint8Array> {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const keyCopy = new Uint8Array(keyBytes);
    const msgCopy = new Uint8Array(msgBytes);
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      keyCopy,
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"]
    );
    const sig = await window.crypto.subtle.sign("HMAC", cryptoKey, msgCopy);
    return new Uint8Array(sig);
  }
  return hmacSha1Fallback(keyBytes, msgBytes);
}

async function generateTotpAtCounter(secret: string, counter: number): Promise<string> {
  const key = base32ToBytes(secret);
  const msg = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    msg[i] = c & 0xff;
    c = Math.floor(c / 256);
  }

  const hmac = await hmacSha1(key, msg);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (code % 1_000_000).toString().padStart(6, "0");
}

export async function verifyTotpCode(
  secret: string,
  inputCode: string,
  windowSteps = 1
): Promise<boolean> {
  const cleanCode = inputCode.replace(/\s+/g, "").trim();
  if (!/^\d{6}$/.test(cleanCode) || !secret) return false;

  const currentStep = Math.floor(Date.now() / 1000 / 30);
  for (let delta = -windowSteps; delta <= windowSteps; delta++) {
    const expected = await generateTotpAtCounter(secret, currentStep + delta);
    if (expected === cleanCode) {
      return true;
    }
  }
  return false;
}

export function buildOtpAuthUri(
  secret: string,
  accountName = "superadmin",
  issuer = "My School ID"
): string {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
