# Step 1 build the angular application using production config
FROM node:latest as build

WORKDIR /app

COPY package*.json ./

RUN npm ci

RUN npm install -g @angular/cli

COPY . .

RUN npm run build --configuration=production

# Step 2 Use nginx to serve the application
FROM nginx:latest

COPY ./nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/snippy-frontend/browser /usr/share/nginx/html

EXPOSE 80

#BUILD: docker build -t snippy-frontend .
#RUN: docker run -d -p 8080:80 snippy-frontend