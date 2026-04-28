FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy source code
COPY . .

# Install all dependencies (need devDeps for build)
RUN npm install

# Build TypeScript
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start the server
CMD ["node", "build/api/index.js"]
