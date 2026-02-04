# Multi-stage build for production
FROM node:18-alpine AS build

ARG VITE_SKIP_API
ARG VITE_SKIP_AUTH_CHECK
ARG VITE_API_BASE_URL
ARG VITE_SOCKET_URL
ARG VITE_MAPBOX_TOKEN
ARG VITE_GOOGLE_CLIENT_ID

ENV VITE_SKIP_API=$VITE_SKIP_API
ENV VITE_SKIP_AUTH_CHECK=$VITE_SKIP_AUTH_CHECK
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed (optional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]