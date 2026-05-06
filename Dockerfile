FROM node:20-bookworm-slim

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files for dependency resolution
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/secure-banking/package.json ./artifacts/secure-banking/

# Install Node dependencies
RUN pnpm install



# Copy all source files
COPY . .

# Build all packages
RUN pnpm run build

# Make start script executable
RUN chmod +x start.sh

# Expose ports
EXPOSE 5000

CMD ["./start.sh"]
