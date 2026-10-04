# Multi-stage build
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root package files for workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy app package
COPY apps/goal-hedef/package.json ./apps/goal-hedef/

# Copy other app folders if they have packages (for workspace resolution)
COPY packages/ ./packages/ 2>/dev/null || true

# Install dependencies
RUN pnpm install

# Copy entire application source
COPY . ./

# Build production bundle
RUN pnpm -F goal-hedef build

# Production server
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

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

