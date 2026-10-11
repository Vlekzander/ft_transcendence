#!/bin/sh
set -e

mkdir -p /etc/nginx/certs
cp /run/secrets/ssl_crt /etc/nginx/certs/ssl.crt
cp /run/secrets/ssl_key /etc/nginx/certs/ssl.key

exec "$@"
