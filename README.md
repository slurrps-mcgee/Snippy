# Project Name

This is a copepen.io clone meant to be opensource and available on dockerhub to run as a service using docker-compose. It currently does not have a frontend yet as this is for my capstone project and is a work in progress.

## Table of Contents
- [Description](#description)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Example `docker-compose.yml`](#example-docker-composeyml)
- [Contributing](#contributing)
- [License](#license)
- [Development](#development)

## Description
This project uses Auth0 for user management, MYSQL for DB, NODE.JS for API, and Angular for frontend

## Prerequisites
Make sure you have the following installed:
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Auth0] (https://auth0.com/) an account is needed and setup which will go over in detail in the usage section

## Getting Started
Clone the repository:

```bash
git clone https://github.com/yourusername/your-repo.git
cd your-repo
```

## Usage

First setup an Auth0 account if you don't already have one.

You will need several things from there to have this work
Create an application EX URL: http://localhost:4200
- Set the callback URL to which ever URL you are using for the url/userhome
- Set the logout URL url/home
- Set the web origins url

Use the Domain and ClientID in the FrontEnd section of the .env

Create an API EX URL: http://localhost:3000
- Set the URL here to the one of your API URL you have setup
and use the identifier you used for your API in the audience section of the .env the domain should be the same as the FrontEnd



Here is an example of the variables needed in your .env to run on docker-compose replacing descriptions with values

```env
# DB
# OPTIONAL
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
# REQUIRED
DB_PASS= Mcgee7089!?@
MYSQL_ROOT_PASSWORD= Mcgee7089!?@

# API
# OPTIONAL
API_PORT=3000
FRONTEND_ORIGIN=frontend
INVITE_ONLY=true
# REQUIRED
JWT_SECRET=secret

# FRONTEND
# OPTIONAL
FRONTEND_PORT=4200
# REQUIRED
```

```yaml
version: '3.8'
services:
  db:
    image: kennyl777/snippy-db:latest
    container_name: snippy-db
    env_file:
      - ./.env
    ports:
      - "${DB_PORT:-3306}:3306"
    volumes:
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p$MYSQL_ROOT_PASSWORD"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  api:
    image: kennyl777/snippy-api:latest
    container_name: snippy-api
    env_file:
      - ./.env
    ports:
      - "${API_PORT:-3000}:3000"
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

volumes:
  mysql-data:
```

## Development

When testing in development please use the following as an example docker-compose.yaml file

```yaml
version: '3.8'
services:
  db:
    image: mysql:8.0
    container_name: snippy-db
    env_file:
      - ./.env
    volumes:
      - mysql-data:/var/lib/mysql
      - ./snippy/db/init.sh:/docker-entrypoint-initdb.d/init.sh
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p$MYSQL_ROOT_PASSWORD"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  api:
    container_name: snippy-api
    build: ./snippy/backend
    working_dir: /backend
    volumes:
      - ./snippy/backend:/backend
    ports:
      - "${API_PORT:-3000}:3000"
    env_file:
      - ./.env
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    command: npm run dev

  frontend:
    container_name: snippy-frontend
    build: ./snippy/frontend
    volumes:
      - ./snippy/frontend:/frontend
    ports:
      - "${FRONTEND_PORT:-8080}:80"
    env_file:
      - ./.env
    restart: unless-stopped
    depends_on:
      - api

volumes:
  mysql-data:
```
Run the following docker commands when testing

docker compose down -v - if needing to remove mysql data
docker compose up 