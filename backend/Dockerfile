# -------- STAGE 1: Install dependencies --------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy only package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# -------- STAGE 2: Runtime image --------
FROM node:18-alpine

# Create non-root user (SECURITY BEST PRACTICE)
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY . .

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000

# Healthcheck (MANDATORY for Docker Compose & Jenkins)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
 CMD wget --no-verbose --tries=1 --spider http://localhost:4000/ || exit 1

CMD ["node", "server.js"]
