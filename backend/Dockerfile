# Multi-stage production Dockerfile for Nestora Backend
# Stage 1: Build & compile TypeScript and Prisma client
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies if needed
RUN apk add --no-cache libc6-compat

# Copy dependency specifications and Prisma schema first for optimal Docker layer caching
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy tsconfig and source code
COPY tsconfig.json ./
COPY src ./src/

# Compile TypeScript to dist/
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Install dumb-init and wget for robust PID 1 signal forwarding and health checks
RUN apk add --no-cache dumb-init wget

ENV NODE_ENV=production
ENV PORT=4000

# Create dedicated unprivileged user for security
RUN addgroup -g 1001 -S nestoragroup && \
    adduser -u 1001 -S nestorauser -G nestoragroup

# Copy package definitions and install production-only dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy generated Prisma Client and compiled application artifacts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Create local media uploads directory structure with proper owner permissions
RUN mkdir -p /app/uploads/properties /app/uploads/projects /app/uploads/cms /app/uploads/general && \
    chown -R nestorauser:nestoragroup /app/uploads

# Expose backend port
EXPOSE 4000

# Health check verifies API responsiveness and database connectivity via /api/v1/health
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/v1/health || exit 1

# Run with non-root user
USER nestorauser

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/server.js"]
