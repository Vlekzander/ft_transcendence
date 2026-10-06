FROM node:24-alpine AS builder

WORKDIR /home/node

COPY tsconfig.base.json ./
COPY package.json package-lock.json ./
COPY apps/server/package.json ./apps/server/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm install

COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

RUN npm run build --workspace=@ft_transcendence/shared
RUN npm run build --workspace=@ft_transcendence/server

FROM node:24-alpine AS runner

RUN apk add --no-cache tini

WORKDIR /home/node
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/server/package.json ./apps/server/package.json
COPY apps/server/prisma.config.ts ./apps/server/prisma.config.ts

RUN npm install --omit=dev

COPY --chown=node:node --from=builder /home/node/packages/shared/dist ./packages/shared/dist
COPY --chown=node:node --from=builder /home/node/apps/server/dist ./apps/server/dist
COPY --chown=node:node apps/server/prisma ./apps/server/prisma
COPY --chown=node:node docker/backend-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
RUN mkdir -p /home/node/apps/server/uploads/avatars

RUN chown -R node:node /home/node

USER node

EXPOSE 3000

ENTRYPOINT ["tini", "--", "/usr/local/bin/entrypoint.sh"]
CMD ["npm", "run", "start", "-w", "@ft_transcendence/server"]
