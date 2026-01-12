# syntax=docker/dockerfile:1.4
# Build stage for portal (UMD bundles)
FROM node:18-alpine AS build-portal
WORKDIR /app
RUN npm install -g pnpm
COPY package*.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
# Copy source files
COPY . .
# Build sequentially to avoid memory exhaustion (--parallel=1 forces sequential execution)
# Use Nx cache mount for faster builds
RUN --mount=type=cache,target=/root/.nx/cache \
    pnpm nx run-many --target=build --projects=portal,sanad-ai,muhallil-ahkam --parallel=1

# Build stage for Sanad AI standalone
FROM node:18-alpine AS build-sanad-ai
WORKDIR /app
RUN npm install -g pnpm
COPY package*.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
# Use Nx cache mount for faster builds
RUN --mount=type=cache,target=/root/.nx/cache \
    BUILD_MODE=standalone pnpm nx build sanad-ai

# Build stage for Muhallil Ahkam standalone
FROM node:18-alpine AS build-muhallil-ahkam
WORKDIR /app
RUN npm install -g pnpm
COPY package*.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
# Use Nx cache mount for faster builds
RUN --mount=type=cache,target=/root/.nx/cache \
    BUILD_MODE=standalone pnpm nx build muhallil-ahkam

# Production stage - Portal (with UMD bundles)
FROM nginx:alpine AS production
COPY --from=build-portal /app/dist/apps/portal/ /usr/share/nginx/html/
COPY --from=build-portal /app/dist/packages/sanad-ai/sanad-ai-v3.js /usr/share/nginx/html/sanad-ai-v3.js
COPY --from=build-portal /app/dist/packages/muhallil-ahkam/muhallil-ahkam.js /usr/share/nginx/html/muhallil-ahkam.js
# Copy fonts from sanad-ai package
COPY --from=build-portal /app/dist/packages/sanad-ai/fonts/ /usr/share/nginx/html/fonts/
COPY nginx.conf /etc/nginx/nginx.conf
RUN rm -f /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Production stage - Sanad AI standalone
FROM nginx:alpine AS sanad-ai-standalone
COPY --from=build-sanad-ai /app/dist/packages/sanad-ai/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf
RUN rm -f /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Production stage - Muhallil Ahkam standalone
FROM nginx:alpine AS muhallil-ahkam-standalone
COPY --from=build-muhallil-ahkam /app/dist/packages/muhallil-ahkam/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf
RUN rm -f /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 