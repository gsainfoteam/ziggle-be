#Step 1: Build the app in image 'builder'
FROM node:18 AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --platform=linuxmusl

COPY . .

RUN npx prisma generate

RUN npm run build

#Step 2: Copy the build from 'builder' to 'runner'
FROM node:18-alpine

WORKDIR /app

ENV TZ=Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone && \
  apk update && \
  apk add build-base libheif vips-dev vips -q

COPY --from=builder /app ./

EXPOSE 3000

CMD ["./run.sh"]
