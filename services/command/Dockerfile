FROM node:18-slim


RUN apt-get update -y && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app


RUN npm install -g pnpm


COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./


COPY packages/database ./packages/database
COPY packages/typescript-config ./packages/typescript-config


COPY services/command ./services/command


RUN pnpm install --no-frozen-lockfile


WORKDIR /app/packages/database
RUN npx prisma generate
RUN pnpm build


WORKDIR /app/services/command
RUN pnpm build


COPY services/command/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh


ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]


CMD ["pnpm", "start"]