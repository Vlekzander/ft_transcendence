FROM node:24-alpine

RUN apk add --no-cache tini

WORKDIR /home/node

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm install

EXPOSE 5173

ENTRYPOINT ["tini", "--"]
CMD ["npm", "run", "dev", "--silent", "--workspace", "@ft_transcendence/web", "--", "--host"]
