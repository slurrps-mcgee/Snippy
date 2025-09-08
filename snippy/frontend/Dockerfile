# Use official Node.js image as the build environment
FROM node:20 AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Angular app in production mode
RUN npm run build -- --output-path=dist

# Use Nginx to serve the built app
FROM nginx:alpine

# Copy built Angular app to Nginx html directory
COPY --from=build /dist /usr/share/nginx/html

# Copy custom Nginx config if needed (optional)
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
