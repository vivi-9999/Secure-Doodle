import crypto from "crypto";

const RAW_SECRET = "securebank-aes-master-key-change-in-prod";
const AES_KEY = crypto.createHash("sha256").update(RAW_SECRET).digest();

export function encrypt(data: Record<string, unknown>): string {
  const plaintext = Buffer.from(JSON.stringify(data), "utf-8");
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", AES_KEY, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([nonce, ciphertext, tag]);
  return combined.toString("base64");
}

export function decrypt(encoded: string): Record<string, unknown> {
  const combined = Buffer.from(encoded, "base64");
  const nonce = combined.subarray(0, 12);
  const ciphertext = combined.subarray(12, combined.length - 16);
  const tag = combined.subarray(combined.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", AES_KEY, nonce);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString("utf-8"));
}

const original = { test: "data" };
const enc = encrypt(original);
const dec = decrypt(enc);
console.log("Encrypted:", enc);
console.log("Decrypted:", dec);
