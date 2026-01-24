FROM node:18-alpine

WORKDIR /app


RUN npm install -g pnpm


COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/mqtt-bridge/package.json ./services/mqtt-bridge/


RUN pnpm install --filter mqtt-bridge --prod


COPY services/mqtt-bridge/index.js ./index.js


ENV NODE_PATH=/app/services/mqtt-bridge/node_modules

CMD ["node", "index.js"]