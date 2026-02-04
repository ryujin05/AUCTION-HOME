# Use Node.js 18 Alpine for a lightweight image
FROM node:18-alpine

# Set working directory to backend folder
WORKDIR /app/backend

# Copy package files
COPY package*.json ./

# Install dependencies (include dev dependencies for now to avoid issues)
RUN npm ci

# Copy backend source code
COPY backend/ ./

# Expose the port the app runs on
EXPOSE 5000

# Health check (optional, checks if the app responds)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/check-auth', (res) => { process.exit(res.statusCode === 401 ? 0 : 1) })"

# Start the application
CMD ["node", "server.js"]