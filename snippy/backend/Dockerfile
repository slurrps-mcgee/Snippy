# Step 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Install deps (including dev)
COPY package*.json ./
RUN npm install

# Copy all source and config
COPY . .

# Build TypeScript
RUN npm run build

# Step 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Only copy package files and install production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/database/migrations ./dist/database/migrations
COPY --from=build /app/src/database/config.cjs ./src/database/config.cjs
COPY --from=build /app/.sequelizerc ./.sequelizerc

# Expose port from env or default
EXPOSE 3000

# Step 3: Run compiled app (migrations run on boot)
CMD ["node", "dist/index.js"]
