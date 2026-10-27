FROM node:24-alpine AS builder

ARG DOMAIN_NAME=localhost
ARG WEB_PORT=443

WORKDIR /home/node

COPY tsconfig.base.json ./
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm install

COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

ENV VITE_API_URL=/api
ENV VITE_WS_URL=wss://$DOMAIN_NAME:$WEB_PORT/websocket

RUN npm run build --workspace=@ft_transcendence/shared
RUN npm run build --workspace=@ft_transcendence/web

FROM nginx:alpine

RUN apk add --no-cache tini

COPY --from=builder /home/node/apps/web/dist /usr/share/nginx/html
COPY --chown=node:node docker/frontend-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

RUN rm /etc/nginx/conf.d/default.conf

COPY docker/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

ENTRYPOINT ["tini", "--", "/usr/local/bin/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
