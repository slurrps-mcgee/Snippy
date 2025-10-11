# Snippy

This is a Codepen.io clone that can be hosted locally by anyone and is opensource.

## Overview

This repository contains a 3-service application:
- `db` – MySQL database used by the API initial scripts located in `snippy/db`
- `api` – Node/TypeScript backend located in `snippy/backend`
- `frontend` – Angular frontend located in `snippy/frontend`

Docker Compose is used to run all services together and wire environment variables from a root `.env` file.

## Prerequisites

- Docker (version supporting Compose v2+)
- Docker Compose (or Docker CLI with compose support)
- [Auth0](https://auth0.com/) 
- A terminal and basic familiarity with Docker commands

Verify Docker is running:

```bash
docker --version
docker compose version
```

## Setup Auth0

- Sign up for Auth0 with a free account
- Create Application  
  - Go to the applications section of the left sidebar and click on applications
  - Click on create application
  - Choose Single Page Web Applications the name can be anything
  - Once created go to settings
  - The following will need to be used in the .env variables
    - DOMAIN
    - Client ID
  - Scroll to the Application URIs section and enter the following
    - Allowed Callback URLs
      - http://localhost:4200/home, https://yourcustomdomain.com/home
    - Allowed Logout URLs
      - http://localhost:4200/, https://yourcustomdomain.com/
    - Allowed Web Origins
      - http://localhost:4200, https://yourcustomdomain.com/
  - Save the application
- API Creation
  - Click on APIs on the left sidebar under Applications
  - Click Create API
  - name can be anything
    - Identifier should be
      - http://localhost:3000
    - Keep everything the same and click save

## .env file

Put a `.env` file in the repository root (next to `docker-compose.yml`). Compose will load environment variables from that file. Example `.env`:

```ini
#DB
  #OPTIONAL do not need unless you want the db name to be different
DB_HOST= #DEFAULT db
DB_PORT= #DEFAULT 3306
DB_NAME= #DEFAULT snippy
DB_USER= #DEFAULT snippy_api
  # REQUIRED
DB_PASS= 
MYSQL_ROOT_PASSWORD= 

#AUTH0
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=

  #OPTIONAL only needed only if you change the api address from localhost to be public
AUTH0_AUDIENCE=

#API
  #OPTIONAL
API_PORT= #DEFAULT 3000
  #REQUIRED

#FRONTEND
  #OPTIONAL
FRONTEND_PORT= #DEFAULT 4200
  #REQUIRED

```

Notes: Not all of these variables are needed as most have defaults

## SETUP

### Run the full stack using docker compose pulling from dockerhub

Notes: this assumes you are using portainer to setup .env variables. If not you can update to just use a .env file from the options in the [ENV](#env-file) section

### Docker Compose File Example

```yaml
version: '3.8'
services:
  db:
    image: kennyl777/snippy-db:latest
    container_name: snippy-db
    env_file:
      - stack.env
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
    restart: unless-stopped

  api:
    image: kennyl777/snippy-api:latest
    container_name: snippy-api
    env_file:
      - stack.env
    ports:
      - "${API_PORT:-3000}:3000"
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    image: kennyl777/snippy-frontend:latest
    container_name: snippy-frontend
    env_file:
      - stack.env
    ports:
      - "${FRONTEND_PORT:-4200}:80"
    depends_on:
      - api
    restart: unless-stopped
volumes:
  mysql-data:
```
## Development

### Run downloaded application locally

Notes: You will need to create a .env file in the root of the folder next to the docker-compost.yml file

### Docker Compose File Example

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