# Multi-stage build
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy entire workspace
COPY . ./

# Install dependencies
RUN pnpm install

# Build production bundle for goal-hedef app
RUN pnpm --filter=@hedef/goal-hedef-canvas build

# Production server
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/apps/goal-hedef/dist /usr/share/nginx/html

# Custom nginx configuration for SPA routing
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, no-transform"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

