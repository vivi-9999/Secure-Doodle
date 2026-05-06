import { createHash } from "crypto";

export function hashPin(pin: string): string {
  return createHash("sha256").update(pin + "securebank-salt").digest("hex");
}

export function verifyPin(pin: string, hash: string): boolean {
  return hashPin(pin) === hash;
}
