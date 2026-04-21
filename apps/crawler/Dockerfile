#Step 1: Build the app in image 'builder'
FROM node:24-alpine3.22 AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN apk add --no-cache build-base libheif vips-dev vips
RUN npm ci

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY apps/crawler ./apps/crawler
COPY libs ./libs
COPY prisma ./prisma

RUN npx prisma generate

RUN npx nest build crawler
RUN npm prune --omit=dev

#Step 2: Copy the build from 'builder' to 'runner'
FROM node:24-alpine3.22

WORKDIR /app

ENV TZ=Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone && \
  apk add --no-cache libheif vips-dev vips

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist/apps/crawler ./dist/apps/crawler
COPY --from=builder /app/prisma ./prisma

CMD ["npm", "run", "start:crawler"]
