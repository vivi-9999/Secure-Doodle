/**
 * Crypto client — calls the Python AES-256-GCM microservice.
 * The Python service handles all encrypt/decrypt operations so that
 * transaction records stored in the DB are always encrypted.
 */

const CRYPTO_PORT = process.env.CRYPTO_PORT ?? "5001";
const CRYPTO_BASE = `http://127.0.0.1:${CRYPTO_PORT}`;

export async function encryptTransactionData(data: Record<string, unknown>): Promise<string> {
  const res = await fetch(`${CRYPTO_BASE}/encrypt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    throw new Error(`Crypto service encrypt failed: ${res.status}`);
  }
  const json = (await res.json()) as { encrypted: string };
  return json.encrypted;
}

export async function decryptTransactionData(encrypted: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${CRYPTO_BASE}/decrypt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ encrypted }),
  });
  if (!res.ok) {
    throw new Error(`Crypto service decrypt failed: ${res.status}`);
  }
  const json = (await res.json()) as { data: Record<string, unknown> };
  return json.data;
}
