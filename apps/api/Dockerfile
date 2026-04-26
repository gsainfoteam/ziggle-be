#Step 1: Build the app in image 'builder'
FROM node:24-alpine3.22 AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN apk add --no-cache build-base libheif vips-dev vips openssl
RUN npm ci

# Build stage only: Prisma generate requires DATABASE_URL to be defined.
# Value is dummy to avoid error during build.
ENV DATABASE_URL=dummy

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY prisma.config.ts ./
COPY apps/api ./apps/api
COPY libs ./libs
COPY prisma ./prisma

RUN npx prisma generate --generator client

RUN npm run build
RUN npm prune --omit=dev

#Step 2: Copy the build from 'builder' to 'runner'
FROM node:24-alpine3.22

WORKDIR /app

ENV TZ=Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone && \
  apk add --no-cache libheif vips openssl

COPY --chown=node:node --from=builder /app/package.json /app/package-lock.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist/apps/api ./dist/apps/api
COPY --chown=node:node --from=builder /app/generated ./generated
COPY --chown=node:node --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --chown=node:node --from=builder /app/prisma ./prisma

EXPOSE 3000

USER node

CMD ["npm", "run", "start:deploy"]
