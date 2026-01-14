# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copiamos package files
COPY package*.json ./

# Instalamos deps
RUN npm install

# Copiamos todo el código
COPY . .

# Generamos Prisma Client
RUN npx prisma generate

# Compilamos NestJS
RUN npm run build

# ---------- PRODUCTION STAGE ----------
FROM node:20-alpine

WORKDIR /app

# Copiamos solo lo necesario
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package*.json ./

# Exponemos puerto
EXPOSE 3000

# Arranque
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
