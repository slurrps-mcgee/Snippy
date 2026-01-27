# Step 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Install deps (including dev)
COPY package*.json ./
RUN npm install

# Copy all source and config
COPY . .

# Build TypeScript
RUN npm run build

# Step 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Only copy package files and install production deps
COPY package*.json ./
RUN npm install

# Copy built files from build stage
COPY --from=build /app/dist ./dist

# Expose port from env or default
EXPOSE 3000

# Step 3: Run compiled app
CMD ["sh", "-c", "npx sequelize-cli db:migrate && node dist/index.js"]
