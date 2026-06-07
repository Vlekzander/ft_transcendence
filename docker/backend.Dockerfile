FROM node:24-alpine

RUN apk add --no-cache tini

WORKDIR /home/node

COPY package.json package-lock.json ./
COPY apps/server/package.json ./apps/server/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm install

EXPOSE 5173

ENTRYPOINT ["tini", "--"]
CMD ["npm", "run", "dev", "--workspace", "@ft_transcendence/server"]
