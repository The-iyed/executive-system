# syntax=docker/dockerfile:1.4
# Build stage for Minister Mind standalone
FROM node:18-alpine AS build-minister-mind
WORKDIR /app
RUN npm install -g pnpm
COPY package*.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
# Use Nx cache mount for faster builds - use standalone configuration
RUN --mount=type=cache,target=/root/.nx/cache \
    BUILD_MODE=standalone pnpm nx build minister-mind --configuration=standalone

# Production stage - Minister Mind standalone
FROM nginx:alpine AS minister-mind-standalone
COPY --from=build-minister-mind /app/dist/packages/minister-mind/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf
RUN rm -f /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 