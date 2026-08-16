# Step 1 build the angular application using production config
FROM node:22 AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

RUN npm install -g @angular/cli

COPY . .

RUN npm run build -- --configuration=production

# Step 2 Use nginx to serve the application
FROM nginx:1.31-alpine

# Install curl for health checks
RUN apk add --no-cache curl

COPY ./nginx.minio.conf /etc/nginx/nginx.minio.conf
COPY ./nginx.nominio.conf /etc/nginx/nginx.nominio.conf

COPY --from=build /app/dist/snippy-frontend/browser /usr/share/nginx/html

# Step 3 copy entrypoint script that writes runtime env.js
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]