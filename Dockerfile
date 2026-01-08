FROM node:20-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Remove devDependencies after build to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 3000

# Run the application
CMD ["npm", "start"]
