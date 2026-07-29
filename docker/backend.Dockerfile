FROM node:24-alpine

RUN apk add --no-cache tini

WORKDIR /home/node

COPY docker/backend-entrypoint.sh /tmp/backend-entrypoint.sh
COPY package.json package-lock.json ./
COPY apps/server/package.json ./apps/server/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm install

EXPOSE 3000

ENTRYPOINT ["tini", "--", "sh", "/tmp/backend-entrypoint.sh"]
CMD ["npm", "run", "dev", "--workspace", "@ft_transcendence/server"]
