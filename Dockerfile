# ========== Stage 1: Build ==========
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDeps for TypeScript build)
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# ========== Stage 2: Production ==========
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built JS from builder stage
COPY --from=builder /app/dist ./dist

# Copy service account key
COPY serviceAccountKey.json ./

# Copy .env file for production config
COPY .env ./

# Expose port
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/server.js"]
