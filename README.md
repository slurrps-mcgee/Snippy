# Snippy

This is a Codepen.io clone that can be hosted locally by anyone and is opensource.

## Table of Contents
* [Overview] (#overview)
* [Prerequisites](#prerequisites)
* [`Auth0 Setup`](#auth0-setup)
* [`ENV file`](#env-file)
* [`Primary Setup`](#primary-setup)
* [`Development Setup`](#development-setup)
* [`NGINX Setup`](*nginx-setup)

## Overview

This repository contains a 3-service application:
- `db` – MySQL database used by the API initial scripts located in `snippy/db`
- `api` – Node/TypeScript backend located in `snippy/backend`
- `frontend` – Angular frontend located in `snippy/frontend`

Docker Compose is used to run services together and wire environment variables from a root `.env` file.

**Two Docker workflows:**

| | Local development | Production deploy |
|---|---|---|
| Compose file | [`docker-compose.yml`](docker-compose.yml) | [`docker-compose.prod.example.yml`](docker-compose.prod.example.yml) |
| Images | Built locally from `Dockerfile.dev` | Pulled from Docker Hub (`kennyl777/snippy-*`) |
| CI | Not used | [`.github/workflows/docker-image.yml`](.github/workflows/docker-image.yml) |
| Frontend | `ng serve` on port 4200 (hot reload) | nginx on port 80 |

## Prerequisites

- Docker (version supporting Compose v2+)
- Docker Compose (or Docker CLI with compose support)
- Portainer setup
- [Auth0](https://auth0.com/) 
  - *NOTE: Either run docker locally or use cloudflare tunnel to tunnel the frontend service as Auth0 only works on a secure origin.
- A terminal and basic familiarity with Docker commands

Verify Docker is running:

```bash
docker --version
docker compose version
```

## Auth0 Setup

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

## ENV file

Put a `.env` file in the repository root (next to `docker-compose.yml`). Compose will load environment variables from that file. Example `.env`:

```ini
# DB
# OPTIONAL
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
# REQUIRED
DB_PASS= Mcgee7089!?@
MYSQL_ROOT_PASSWORD= Mcgee7089!?@

# minIO
# OPTIONAL
# MINIO_ENDPOINT=minio
# MINIO_PORT=9000
# MINIO_USE_SSL=false
# MINIO_BUCKET_POLICY=public
# MINIO_BUCKET=content
# REQUIRED
ENABLE_MINIO=true #Default is false
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_APP_USER=snippyappuser
MINIO_APP_PASSWORD=SnippyAppUserPass123!

# AUTH0
AUTH0_AUDIENCE=
AUTH0_DOMAIN=dev-4ev7py4uqxc7prli.us.auth0.com
AUTH0_CLIENT_ID=n5bdvh7IGhMZ1AE69sPkQ3wzCUOhoWIj
```

Notes: Not all of these variables are needed as most have defaults

## Primary Setup

### Run the production stack using pre-built Docker Hub images

Production images are built and published by GitHub Actions. Deploy them with Portainer or Docker Compose — do **not** use the root `docker-compose.yml` for this (that file is for local development only).

Notes: this assumes you are using Portainer to set up `.env` variables. If not, you can use a `.env` file as described in the [ENV](#env-file) section (rename or copy to `stack.env` for the prod compose file).

*** Important *** If you are running Docker on another computer and want to access it locally only, you will need to set up nginx proxy manager with a self-signed cert — Auth0 requires a secure origin and will not work using the IP of the Docker container. Follow [NGINX Setup](#nginx-setup) instead of this Primary Setup.

Use [`docker-compose.prod.example.yml`](docker-compose.prod.example.yml) as your starting point. Copy it into Portainer or run:

```bash
docker compose -f docker-compose.prod.example.yml up -d
```

Key differences from local dev:
- Services use `kennyl777/snippy-*` images (nginx frontend on port 80, not `ng serve`)
- Requires external `NPM` network when using nginx proxy manager
- Environment file is typically named `stack.env`

## Development Setup

### Run locally with hot reload

The root [`docker-compose.yml`](docker-compose.yml) is **local development only**. It builds from `Dockerfile.dev`, bind-mounts source code, and runs:

- **db** — `mysql:8.0` with `init.sh` mounted for easy script edits
- **api** — `npm run dev` (ts-node-dev) on port 3000
- **frontend** — `ng serve` on port 4200 with API proxy and runtime `env.js` from `.env`

Create a `.env` file in the repository root (next to `docker-compose.yml`), then start the stack:

```bash
docker compose up --build
```

Open `http://localhost:4200`. The frontend entrypoint writes `public/env.js` from your `.env` before `ng serve` starts.

To pick up `.env` changes, restart the frontend container:

```bash
docker compose restart frontend
```

Production images (`Dockerfile`, not `Dockerfile.dev`) are built only by GitHub Actions and pushed to Docker Hub. To smoke-test a prod build locally:

```bash
docker build -f snippy/backend/Dockerfile snippy/backend
docker build -f snippy/frontend/Dockerfile snippy/frontend
```

## NGINX Setup

### Portainer
- Setup a new docker network called NPM
- Create a new stack for nginx using the below yaml
```yaml
services:
  app:
    image: 'jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'
      - '81:81'
      - '443:443'
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
    networks:
      - NPM

networks:
  NPM:
    external: true
```

- Setup the env variables using the [ENV](#env-file)