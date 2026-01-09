 # Build stage
FROM node:18-alpine AS build
WORKDIR /app
# Install pnpm
RUN npm install -g pnpm
COPY package*.json ./
RUN pnpm install
COPY . .
RUN pnpm run build:all

# Production stage
FROM nginx:alpine AS production
# Copy portal files to root (use trailing slash to copy contents)
COPY --from=build /app/dist/apps/portal/ /usr/share/nginx/html/
# Copy package bundles
COPY --from=build /app/dist/packages/sanad-ai/ /usr/share/nginx/html/packages/sanad-ai/
COPY --from=build /app/dist/packages/muhallil-ahkam/ /usr/share/nginx/html/packages/muhallil-ahkam/
COPY nginx.conf /etc/nginx/nginx.conf
RUN rm -f /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 