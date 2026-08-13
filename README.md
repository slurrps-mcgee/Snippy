# Snippy

Snippy is an open-source [CodePen](https://codepen.io/)-style app for writing, previewing, and sharing HTML, CSS, and JavaScript snippets. Anyone can run it locally for testing or deploy it in production by pulling pre-built images from Docker Hub.

- **Repository:** [github.com/slurrps-mcgee/Snippy](https://github.com/slurrps-mcgee/Snippy)
- **License:** [MIT](https://github.com/slurrps-mcgee/Snippy/blob/main/LICENSE)
- **Docker Hub images:** `kennyl777/snippy-api`, `kennyl777/snippy-frontend`, `kennyl777/snippy-db`, `kennyl777/snippy-minio`

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Auth0 setup](#auth0-setup)
- [Environment variables](#environment-variables)
- [Local development (testing)](#local-development-testing)
- [Production deployment (Docker Hub)](#production-deployment-docker-hub)
- [Nginx Proxy Manager setup](#nginx-proxy-manager-setup)
- [Updating production images](#updating-production-images)
- [Troubleshooting](#troubleshooting)
- [Project layout](#project-layout)
- [Documentation](#documentation)
- [License and legal](#license-and-legal)

---

## Overview

Snippy is a multi-service Docker Compose app:

| Service | Role | Source |
|---|---|---|
| `db` | MySQL 8 database (schema bootstrap via `init.sh`) | `snippy/db` |
| `api` | Node/TypeScript Express API | `snippy/backend` |
| `frontend` | Angular SPA | `snippy/frontend` |
| `minio` / `minio-init` | Optional object storage for asset uploads | official MinIO + `snippy/minio` |

Compose loads environment variables from a root env file and wires the services together.

**Two supported workflows:**

| | Local development / testing | Production deploy |
|---|---|---|
| Compose file | [`docker-compose.yml`](docker-compose.yml) | [`docker-compose.prod.example.yml`](docker-compose.prod.example.yml) |
| Images | Built locally from `Dockerfile.dev` | Pulled from Docker Hub (`kennyl777/snippy-*`) |
| Frontend | `ng serve` on port **4200** (hot reload) | nginx on container port **80** |
| Env file | `.env` | `stack.env` (or Portainer stack env) |
| CI / image publish | Not used | [`.github/workflows/docker-image.yml`](.github/workflows/docker-image.yml) |
| Network | Default Compose network | External Docker network named `NPM` (for Nginx Proxy Manager) |

> **Do not** use the root `docker-compose.yml` for production. It bind-mounts source, runs `ng serve`, and is intended only for local testing.

---

## Features

Shipped today:

- Live HTML / CSS / JS editor with instant preview and layout options
- Per-account editor preferences (theme, font, indent, line numbers, wrapping, folding, autocomplete) with Settings live preview
- Guest `/try` editor and public `/embed/:shortId` player (tabs, editable, theme query params)
- Public and private snippets, shareable links, full-page view
- Account privacy toggle (private profiles hidden from others)
- Favorites, comments, follows, collections, and forking
- External CSS / JS resources on snippets
- ZIP export of snippet files

Coming soon (UI may show placeholders):

- Upload assets (requires MinIO; product feature still evolving)
- Projects

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with Compose v2 (`docker compose`)
- A terminal and basic familiarity with Docker
- An [Auth0](https://auth0.com/) free account (required for login)
- For production behind a domain: something that terminates TLS (this repo documents [Nginx Proxy Manager](#nginx-proxy-manager-setup) + Portainer, which is optional but recommended)

Verify Docker:

```bash
docker --version
docker compose version
```

### Auth0 and HTTPS

Auth0 Single Page Applications expect a **secure origin** in real browsers for many flows. Practical options:

1. **Local testing on the same machine** — `http://localhost:4200` is generally accepted by Auth0 for development.
2. **Accessing a Docker host by LAN IP** — Auth0 will often fail on plain `http://192.168.x.x`. Put HTTPS in front (self-signed or real cert via Nginx Proxy Manager) and use that hostname in Auth0.
3. **Production** — use a real domain with HTTPS and register those URLs in Auth0.

---

## Auth0 setup

Complete this before starting either local or production stacks.

### 1. Create a Single Page Application

1. Sign up / log in at [Auth0](https://auth0.com/).
2. **Applications → Applications → Create Application**.
3. Choose **Single Page Web Applications**.
4. Open the app **Settings** and copy:
   - **Domain** → `AUTH0_DOMAIN`
   - **Client ID** → `AUTH0_CLIENT_ID`

### 2. Application URIs

Under **Application URIs**, set values for every environment you will use.

**Local development example:**

| Field | Value |
|---|---|
| Allowed Callback URLs | `http://localhost:4200/home` |
| Allowed Logout URLs | `http://localhost:4200/` |
| Allowed Web Origins | `http://localhost:4200` |

**Production example** (replace with your domain):

| Field | Value |
|---|---|
| Allowed Callback URLs | `https://snippy.example.com/home` |
| Allowed Logout URLs | `https://snippy.example.com/` |
| Allowed Web Origins | `https://snippy.example.com` |

You can list multiple origins comma-separated if you run both local and production against the same Auth0 app.

Save the application.

### 3. Create an API

1. **Applications → APIs → Create API**.
2. Name can be anything (for example `Snippy API`).
3. **Identifier** should match what you put in `AUTH0_AUDIENCE`.  
   Common default used by this project: `http://localhost:3000`
4. Leave signing algorithm as RS256 and save.

Use that same identifier as `AUTH0_AUDIENCE` in your env file (local and production). The API Identifier is a string identity for tokens; it does not have to be a publicly reachable URL.

---

## Environment variables

### Where the file lives

| Workflow | File | Location |
|---|---|---|
| Local | `.env` | Repository root (next to `docker-compose.yml`) |
| Production (Compose CLI) | `stack.env` | Same directory as the prod compose file you run |
| Production (Portainer) | Stack environment | Set in the Portainer UI (or paste the same keys) |

Compose automatically loads `.env` for variable substitution and, in this project, services also mount `env_file: ./.env` (local) or `stack.env` (prod example).

### Example `.env` / `stack.env`

Use strong unique passwords. **Do not commit real secrets.**

```ini
# ── Database (required) ──────────────────────────────────────────
# MYSQL_ROOT_PASSWORD is required by the MySQL image.
MYSQL_ROOT_PASSWORD=change-me-root-password

# App DB user password (required by the API).
DB_PASS=change-me-app-password

# Optional overrides (defaults shown):
# DB_HOST=db
# DB_PORT=3306
# DB_NAME=snippy
# DB_USER=snippy_api

# ── Auth0 (required for login) ───────────────────────────────────
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your-spa-client-id
AUTH0_AUDIENCE=http://localhost:3000

# Frontend origin used by API CORS. Must match the URL users open.
# Local:
FRONTEND_URL=http://localhost:4200
# Production example:
# FRONTEND_URL=https://snippy.example.com

# ── Ports (optional) ─────────────────────────────────────────────
# API_PORT=3000
# FRONTEND_PORT=4200
# DB_PORT=3306

# ── MinIO / asset uploads (optional) ─────────────────────────────
# Local compose has MinIO commented out by default.
# Prod example includes MinIO services.
ENABLE_MINIO=false
# ENABLE_MINIO=true
# MINIO_ROOT_USER=minioadmin
# MINIO_ROOT_PASSWORD=change-me-minio-root
# MINIO_APP_USER=snippyappuser
# MINIO_APP_PASSWORD=change-me-minio-app
# MINIO_ENDPOINT=minio
# MINIO_PORT=9000
# MINIO_USE_SSL=false
# MINIO_BUCKET=content
# MINIO_BUCKET_POLICY=public
```

### Variable reference

| Variable | Required | Default / notes |
|---|---|---|
| `MYSQL_ROOT_PASSWORD` | Yes | MySQL root password |
| `DB_PASS` | Yes | Password for `DB_USER` (API connects with this) |
| `DB_HOST` | No | `db` |
| `DB_PORT` | No | `3306` (host publish in prod compose uses `${DB_PORT:-3306}`) |
| `DB_NAME` | No | `snippy` |
| `DB_USER` | No | `snippy_api` |
| `AUTH0_DOMAIN` | Yes (login) | Auth0 tenant domain |
| `AUTH0_CLIENT_ID` | Yes (login) | SPA Client ID (written into frontend `env.js`) |
| `AUTH0_AUDIENCE` | No | `http://localhost:3000` — must match Auth0 API Identifier |
| `FRONTEND_URL` | Strongly recommended | `http://localhost:4200` — **must** match the browser origin or CORS will block the API |
| `API_PORT` | No | Host port mapped to API `3000` |
| `FRONTEND_PORT` | No (prod) | Host port mapped to frontend nginx `80` (prod example default `4200:80`) |
| `ENABLE_MINIO` | No | `false` — set `true` only when MinIO is running and reachable as `minio:9000` |
| `MINIO_*` | When MinIO enabled | Root/app credentials, bucket name/policy, endpoint |

### How runtime config reaches the frontend

- **Local:** `snippy/frontend/entrypoint.dev.sh` writes `public/env.js` from env vars before `ng serve`.
- **Production image:** `snippy/frontend/entrypoint.sh` writes `/usr/share/nginx/html/env.js` on container start and selects nginx config with or without MinIO proxying.

After changing Auth0 or MinIO-related env vars, **restart the frontend container** so `env.js` is regenerated.

---

## Local development (testing)

This is the path for day-to-day development and local smoke testing with hot reload.

### What you get

From [`docker-compose.yml`](docker-compose.yml):

- **db** — `mysql:8.0` with `snippy/db/init.sh` mounted into `/docker-entrypoint-initdb.d`
- **api** — built from `snippy/backend/Dockerfile.dev`, `npm run dev` (ts-node-dev), source bind-mounted, port **3000**
- **frontend** — built from `snippy/frontend/Dockerfile.dev`, `ng serve` with proxy (`proxy.conf.json`), port **4200**
- **minio** — commented out by default (asset uploads disabled unless you enable the services and `ENABLE_MINIO=true`)

The Angular dev server proxies:

- `/api` → `http://api:3000`
- `/content` → `http://minio:9000` (only useful if MinIO is running)

### Step-by-step

1. **Clone the repository**

   ```bash
   git clone https://github.com/slurrps-mcgee/Snippy.git
   cd Snippy
   ```

2. **Create Auth0** resources as described in [Auth0 setup](#auth0-setup) (local callback/logout/web origin URLs).

3. **Create `.env`** in the repo root using the [example](#example-env--stackenv). At minimum set:

   - `MYSQL_ROOT_PASSWORD`
   - `DB_PASS`
   - `AUTH0_DOMAIN`
   - `AUTH0_CLIENT_ID`
   - `AUTH0_AUDIENCE` (match your Auth0 API Identifier)
   - `FRONTEND_URL=http://localhost:4200`

4. **Start the stack**

   ```bash
   docker compose up --build
   ```

   First run builds the API and frontend dev images and initializes MySQL. That can take several minutes.

5. **Open the app**

   - Frontend: [http://localhost:4200](http://localhost:4200)
   - API (direct): [http://localhost:3000](http://localhost:3000)  
     Browser traffic normally goes through the frontend proxy as `/api/...`.

6. **Log in** with Auth0 from the landing page (“Get Started”).

### Useful local commands

```bash
# Follow logs
docker compose logs -f

# Restart only frontend after .env Auth0 changes
docker compose restart frontend

# Rebuild a single service
docker compose up --build -d api

# Stop (keep volumes / DB data)
docker compose down

# Stop and wipe DB volume (destructive reset)
docker compose down -v
```

### Optional: enable MinIO locally

1. Uncomment the `minio` and `minio-init` services (and `minio_data` volume) in `docker-compose.yml`.
2. Set MinIO variables in `.env` and `ENABLE_MINIO=true`.
3. Run `docker compose up --build`.

Asset uploads are still product-marked as coming soon in places; MinIO wiring exists for deployments that want object storage.

### Optional: smoke-test production Dockerfiles locally

Production images are normally built by GitHub Actions. To build them yourself without publishing:

```bash
docker build -f snippy/backend/Dockerfile snippy/backend
docker build -f snippy/frontend/Dockerfile snippy/frontend
docker build -f snippy/db/Dockerfile snippy/db
docker build -f snippy/minio/Dockerfile snippy/minio
```

Prefer [Production deployment](#production-deployment-docker-hub) with published Hub tags for a full runtime test.

---

## Production deployment (Docker Hub)

Production uses **pre-built images** published to Docker Hub as `kennyl777/snippy-*`. Images are built by the manual GitHub Actions workflow [`.github/workflows/docker-image.yml`](.github/workflows/docker-image.yml) (`workflow_dispatch`), which pushes both version tags (from `package.json`) and `:latest`.

Published images:

| Image | Purpose |
|---|---|
| `kennyl777/snippy-api:latest` | API (compiled Node) |
| `kennyl777/snippy-frontend:latest` | Angular SPA served by nginx |
| `kennyl777/snippy-db:latest` | MySQL 8 + init script |
| `kennyl777/snippy-minio:latest` | One-shot MinIO bucket/user bootstrap |

Use [`docker-compose.prod.example.yml`](docker-compose.prod.example.yml) as your starting point. That file:

- Pulls Hub images (does **not** build from source)
- Expects env file name **`stack.env`**
- Attaches services to an **external** Docker network named **`NPM`**
- Includes MinIO + `minio-init`
- Maps frontend host port `${FRONTEND_PORT:-4200}` → container `80`

### Important production requirements

1. **HTTPS / secure origin** for Auth0 (see [Auth0 and HTTPS](#auth0-and-https)).
2. **`FRONTEND_URL`** must be the exact public origin users type into the browser (scheme + host, no path), or CORS will fail.
3. Auth0 callback / logout / web origin URLs must match that same origin.
4. Create the external `NPM` network before starting the stack (see below), even if you are not using Nginx Proxy Manager yet—or edit the compose file to use a different network.

### Option A — Docker Compose CLI

1. **Copy the example compose file** (optional rename):

   ```bash
   cp docker-compose.prod.example.yml docker-compose.prod.yml
   ```

2. **Create `stack.env`** next to that compose file with production values. Example differences from local:

   ```ini
   MYSQL_ROOT_PASSWORD=change-me-root-password
   DB_PASS=change-me-app-password

   AUTH0_DOMAIN=your-tenant.us.auth0.com
   AUTH0_CLIENT_ID=your-spa-client-id
   AUTH0_AUDIENCE=http://localhost:3000

   FRONTEND_URL=https://snippy.example.com

   ENABLE_MINIO=true
   MINIO_ROOT_USER=minioadmin
   MINIO_ROOT_PASSWORD=change-me-minio-root
   MINIO_APP_USER=snippyappuser
   MINIO_APP_PASSWORD=change-me-minio-app

   # Optional host port mappings
   # FRONTEND_PORT=4200
   # API_PORT=3000
   # DB_PORT=3306
   ```

3. **Create the external network** (once per Docker host):

   ```bash
   docker network create NPM
   ```

4. **Pull and start**

   ```bash
   docker compose -f docker-compose.prod.yml --env-file stack.env pull
   docker compose -f docker-compose.prod.yml --env-file stack.env up -d
   ```

5. **Put TLS in front of the frontend** (recommended): point Nginx Proxy Manager (or another reverse proxy) at the `snippy-frontend` container on port `80` (or whatever host port you published). See [Nginx Proxy Manager setup](#nginx-proxy-manager-setup).

6. **Verify**

   ```bash
   docker compose -f docker-compose.prod.yml ps
   docker compose -f docker-compose.prod.yml logs -f api frontend
   ```

   Open your HTTPS URL, confirm login works, and create a test snippet.

### Option B — Portainer stacks

1. On the Docker host, create the external network if needed:

   ```bash
   docker network create NPM
   ```

2. In Portainer: **Stacks → Add stack**.
3. Paste the contents of [`docker-compose.prod.example.yml`](docker-compose.prod.example.yml) (or upload the file).
4. Add the same keys as in `stack.env` under the stack **Environment variables** UI.  
   If Portainer still expects a file named `stack.env` because of `env_file: stack.env` in the compose, either:
   - place a `stack.env` on the host path Portainer uses for that stack, or
   - adjust the compose `env_file` entries to match how you inject env in Portainer.
5. Deploy the stack.
6. Configure Nginx Proxy Manager to proxy your domain to `snippy-frontend:80` on the `NPM` network (container-to-container), or to the published host port if you prefer.

### Production port map (defaults from the example file)

| Service | Container port | Default host publish |
|---|---|---|
| frontend | `80` | `4200` (`FRONTEND_PORT`) |
| api | `3000` | `3000` (`API_PORT`) |
| db | `3306` | `3306` (`DB_PORT`) |
| minio API | `9000` | `32570` |
| minio console | `9001` | `32571` |

In a typical NPM setup you do **not** need to expose API/DB publicly; the frontend nginx proxies `/api/` to `http://api:3000` on the Docker network.

### First-boot database notes

- MySQL data lives in the `mysql-data` volume.
- `init.sh` runs only on **first** initialization of an empty data directory.
- Changing `DB_PASS` later does **not** automatically update an already-created MySQL user—plan passwords before first boot, or reset the volume (`docker compose ... down -v`) knowing that deletes data.

---

## Nginx Proxy Manager setup

Use this when you want HTTPS (Let’s Encrypt or self-signed) in front of Snippy, especially for Auth0 on non-localhost hosts.

### 1. Create the `NPM` network

```bash
docker network create NPM
```

Snippy’s production compose attaches to this network as `external: true`.

### 2. Deploy Nginx Proxy Manager (example)

Example Portainer / Compose stack:

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

- Admin UI: `http://<docker-host>:81`
- Default login is documented by the [Nginx Proxy Manager project](https://nginxproxymanager.com/) — change it immediately.

### 3. Proxy host for Snippy

1. Ensure the Snippy stack is on the same `NPM` network.
2. In NPM, create a **Proxy Host**:
   - **Domain:** `snippy.example.com`
   - **Scheme:** `http`
   - **Forward hostname:** `snippy-frontend` (container name)  
     or the Docker host IP if forwarding to a published port
   - **Forward port:** `80` (container) or your published `FRONTEND_PORT`
3. Enable **SSL** (Let’s Encrypt or custom/self-signed).
4. Confirm Auth0 Application URIs and `FRONTEND_URL` use `https://snippy.example.com`.

### Self-signed / LAN-only note

If you only need HTTPS on a home LAN, a self-signed cert in NPM is enough for Auth0’s secure-origin requirement, but browsers will warn until you trust the certificate.

---

## Updating production images

When new images are published to Docker Hub:

```bash
docker compose -f docker-compose.prod.yml --env-file stack.env pull
docker compose -f docker-compose.prod.yml --env-file stack.env up -d
```

In Portainer: update the stack / pull and redeploy so containers recreate on `:latest` (or pin specific version tags from Docker Hub / `package.json` versions for more control).

Current version sources:

- API: `snippy/backend/package.json`
- Frontend: `snippy/frontend/package.json`
- DB / MinIO init images: tagged `latest` (and version when available) by the workflow

---

## Troubleshooting

| Symptom | Likely cause | What to try |
|---|---|---|
| Login button does nothing / Auth0 error | Missing or wrong `AUTH0_DOMAIN` / `AUTH0_CLIENT_ID`, or callback URL mismatch | Fix `.env` / `stack.env`, restart **frontend**, verify Auth0 URIs exactly match the browser URL |
| Auth0 “secure origin” / callback failures on LAN IP | Using `http://192.168.x.x` | Put HTTPS in front (NPM) and use a hostname |
| API calls fail with CORS errors | `FRONTEND_URL` ≠ browser origin | Set `FRONTEND_URL` to exact origin (`https://snippy.example.com`), restart **api** |
| Frontend loads but API 502/404 | API not healthy, or nginx/proxy misconfigured | `docker compose logs api`; confirm frontend can reach `api:3000` on the Docker network |
| API crashes on boot | Missing `DB_PASS` or `AUTH0_DOMAIN` | Required by API config validation — set them and recreate the API container |
| DB init / auth failures | Wrong `MYSQL_ROOT_PASSWORD` / `DB_PASS`, or volume from older credentials | Align env with existing volume, or `down -v` for a clean DB (destructive) |
| `network NPM declared as external, but could not be found` | Network not created | `docker network create NPM` |
| MinIO / assets unavailable | `ENABLE_MINIO` false or MinIO not running | Enable MinIO services and set `ENABLE_MINIO=true`; restart frontend so nginx/`env.js` update |
| Env changes ignored in browser | Stale `env.js` | Restart frontend container and hard-refresh the browser |

---

## Project layout

```text
Snippy/
├── docker-compose.yml                 # Local development only
├── docker-compose.prod.example.yml    # Production pull-from-Hub example
├── .github/workflows/docker-image.yml # Build & push Hub images
├── LICENSE                            # MIT
├── README.md
├── documentation/                     # Architecture & QA docs
│   ├── frontend.md
│   ├── backend.md
│   ├── db.md
│   ├── frontend-test-plan.md
│   └── snippy-api.postman_collection.json
└── snippy/
    ├── backend/                       # API
    ├── frontend/                      # Angular app
    ├── db/                            # MySQL image + init.sh
    └── minio/                         # MinIO bootstrap image
```

### Documentation

| Doc | Contents |
|-----|----------|
| [documentation/frontend.md](./documentation/frontend.md) | Angular architecture, editor preferences, themes how-to, embed player |
| [documentation/backend.md](./documentation/backend.md) | API layers, auth, `PUT /users` + `editorPreferences` |
| [documentation/db.md](./documentation/db.md) | Schema (including `users.editor_preferences`) |
| [documentation/frontend-test-plan.md](./documentation/frontend-test-plan.md) | Manual QA checklist |

In-app legal pages (when the frontend is running):

- Privacy Policy: `/privacy`
- Terms and Conditions: `/terms`

Footer links also point at the GitHub repo and MIT license.

---

## License and legal

Snippy source code is released under the [MIT License](./LICENSE) — Copyright (c) Kenneth Lamb.

The hosted service terms and privacy practices are described in the application’s **Terms** and **Privacy Policy** pages. Self-hosted operators are responsible for their own infrastructure, backups, TLS, and compliance.
