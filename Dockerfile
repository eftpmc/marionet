# ---- Build Stage ----
FROM node:22-slim AS builder
WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm install --frozen-lockfile || \
    yarn install --frozen-lockfile || \
    pnpm install --frozen-lockfile

COPY . .

# Build Next.js AND compile worker.ts → dist/lib/worker.js
RUN npm run build

# ---- Production Stage ----
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install Chromium + dependencies + xvfb
RUN apt-get update && apt-get install -y \
    chromium \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    xvfb \
    --no-install-recommends \
 && rm -rf /var/lib/apt/lists/*

# Tell puppeteer where to find Chromium
ENV CHROME_PATH=/usr/bin/chromium

# Copy runtime files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy compiled worker (dist) instead of TS source
COPY --from=builder /app/dist ./dist

# Install concurrently globally to run both processes
RUN npm install -g concurrently

EXPOSE 3000

# Run Next.js + compiled worker together
CMD ["concurrently", "npm run start", "npm run worker"]