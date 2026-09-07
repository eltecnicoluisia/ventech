FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl git

COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/db/prisma ./packages/db/prisma

RUN npm install

WORKDIR /app
COPY . .

RUN git init

RUN cd packages/db && npx prisma generate

WORKDIR /app/apps/web
RUN npx next build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# En monorepos, Next.js standalone preserva la estructura de carpetas
CMD ["node", "apps/web/server.js"]
