FROM node:18-alpine


RUN npm install -g pnpm

RUN apk add --no-cache libc6-compat
WORKDIR /app


COPY package.json pnpm-lock.yaml* tsconfig.json ./


RUN pnpm install


COPY . .


RUN pnpm build


CMD ["node", "dist/index.js"]