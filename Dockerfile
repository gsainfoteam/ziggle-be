#Step 1: Build the app in image 'builder'
FROM node:18 AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --platform=linuxmusl

COPY . .

RUN npm run build

#Step 2: Copy the build from 'builder' to 'runner'
FROM node:18-alpine

WORKDIR /app

ENV TZ=Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY --from=builder /app ./

EXPOSE 3000

RUN npx prisma db push

CMD ["npm", "run", "start:prod"]
