"""
AES-256 Encryption Service for SecureBank
Uses Python cryptography library for AES-256-GCM encryption/decryption
of transaction records stored in the database.
"""

from flask import Flask, request, jsonify
import os
import json
import base64
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

app = Flask(__name__)

# Derive a 256-bit AES key from the environment secret or fallback
RAW_SECRET = os.environ.get("AES_SECRET", "securebank-aes-master-key-change-in-prod")
AES_KEY = hashlib.sha256(RAW_SECRET.encode()).digest()


def encrypt(data: dict) -> str:
    """Encrypt a dict to a base64-encoded string using AES-256-GCM."""
    plaintext = json.dumps(data).encode("utf-8")
    nonce = os.urandom(12)  # 96-bit nonce for GCM
    aesgcm = AESGCM(AES_KEY)
    ciphertext = aesgcm.encrypt(nonce, plaintext, None)
    # Prepend nonce to ciphertext, then base64-encode
    combined = nonce + ciphertext
    return base64.b64encode(combined).decode("utf-8")


def decrypt(encoded: str) -> dict:
    """Decrypt a base64-encoded AES-256-GCM string back to a dict."""
    combined = base64.b64decode(encoded.encode("utf-8"))
    nonce = combined[:12]
    ciphertext = combined[12:]
    aesgcm = AESGCM(AES_KEY)
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return json.loads(plaintext.decode("utf-8"))


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "algorithm": "AES-256-GCM"})


@app.route("/encrypt", methods=["POST"])
def encrypt_endpoint():
    try:
        payload = request.get_json()
        if not payload or "data" not in payload:
            return jsonify({"error": "Missing 'data' field"}), 400
        encrypted = encrypt(payload["data"])
        return jsonify({"encrypted": encrypted})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/decrypt", methods=["POST"])
def decrypt_endpoint():
    try:
        payload = request.get_json()
        if not payload or "encrypted" not in payload:
            return jsonify({"error": "Missing 'encrypted' field"}), 400
        decrypted = decrypt(payload["encrypted"])
        return jsonify({"data": decrypted})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("CRYPTO_PORT", 5001))
    print(f"[SecureBank AES Service] Starting on port {port} with AES-256-GCM")
    app.run(host="127.0.0.1", port=port, debug=False)
