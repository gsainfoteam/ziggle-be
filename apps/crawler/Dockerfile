#Step 1: Build the app in image 'builder'
FROM node:24-alpine3.22 AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN apk add --no-cache build-base libheif vips-dev vips openssl
RUN npm ci

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY apps/crawler ./apps/crawler
COPY libs ./libs
COPY prisma ./prisma

RUN npx prisma generate --generator client

RUN npx nest build crawler
RUN npm prune --omit=dev

#Step 2: Copy the build from 'builder' to 'runner'
FROM node:24-alpine3.22

WORKDIR /app

ENV TZ=Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone && \
  apk add --no-cache libheif vips openssl

COPY --chown=node:node --from=builder /app/package.json /app/package-lock.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist/apps/crawler ./dist/apps/crawler
COPY --chown=node:node --from=builder /app/prisma ./prisma

USER node

CMD ["npm", "run", "start:crawler"]
