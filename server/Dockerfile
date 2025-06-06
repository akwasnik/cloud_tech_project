FROM node:18-alpine
WORKDIR /app

COPY package.json package-lock.json ./
ENV NODE_ENV=production
# Ustawiamy środowisko na produkcyjne, aby zainstalować tylko zależności produkcyjne (domyślnie nie instalować devDependencies)
RUN npm ci --silent && npm cache clean --force

COPY . .