#!/bin/bash
# Start the Python crypto service in the background
cd /app
source .venv/bin/activate
python3 artifacts/api-server/crypto/aes_service.py &

# Start the Node.js API server
cd artifacts/api-server
pnpm run start
