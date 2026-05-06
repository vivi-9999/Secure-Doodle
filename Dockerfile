FROM node:20-bookworm-slim

# Install Python and pnpm
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv \
    && npm install -g pnpm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files for dependency resolution
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/secure-banking/package.json ./artifacts/secure-banking/

# Install Node dependencies
RUN pnpm install

# Setup Python environment
COPY pyproject.toml .
RUN python3 -m venv .venv
RUN .venv/bin/pip install -r <(python3 -c 'import sys, tomli; print("\n".join(tomli.load(sys.stdin)["project"]["dependencies"]))' < pyproject.toml) || \
    .venv/bin/pip install flask cryptography

# Copy all source files
COPY . .

# Build all packages
RUN pnpm run build

# Make start script executable
RUN chmod +x start.sh

# Expose ports
EXPOSE 5000
EXPOSE 5001

CMD ["./start.sh"]
