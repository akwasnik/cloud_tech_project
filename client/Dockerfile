FROM node:18-alpine AS builder
WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci --silent

COPY . .
RUN npm run build

FROM nginx:1.27.5-alpine
COPY --from=builder /build/build /usr/share/nginx/html
