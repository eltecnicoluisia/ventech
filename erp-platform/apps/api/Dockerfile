FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/db/prisma ./packages/db/prisma

RUN npm install

WORKDIR /app
COPY . .

RUN cd packages/db && npx prisma generate

WORKDIR /app/apps/api
RUN npx nest build

FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/db ./packages/db

EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
