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
- [Auth0 Account] (https://auth0.com/)

## Getting Started
Clone the repository:

```bash
git clone https://github.com/yourusername/your-repo.git
cd your-repo
```

## Usage

Here is an example of the variables needed in your .env to run on docker-compose

```env
# DB
# OPTIONAL
DB_HOST=
DB_PORT=
# Required
DB_NAME=
DB_USER=
DB_PASS=
MYSQL_ROOT_PASSWORD=

# API
PORT=
NODE_ENV=
FRONTEND_ORIGIN=
AUTH0_DOMAIN=
AUTH0_AUDIENCE=
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

volumes:
  mysql-data:
```
