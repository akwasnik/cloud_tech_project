## Cloud Tech Project

### Prerequisites
- Docker (version 20.10+)
- Docker Compose (version 1.27+)

### Setup

1. **Clone this repository**  
   ```bash
   git clone https://github.com/akwasnik/cloud_tech_project.git
   cd cloud_tech_project
   ```

2. **Launch all services with Docker Compose**  
   From the project root:
   ```bash
   docker-compose up
   ```
   - This will build the `client` and `server` images (if not already built) and start all containers:
     - **Keycloak** (imports `master-realm.json`)
     - **PostgreSQL** (named `db`)
     - **Redis**
     - **Server** (Node.js backend)
     - **Client** (frontend)

### Environment Variables & Ports

All port mappings come from the `.env` file. By default, the following ports are exposed:

- **Client (frontend)**
  - Env var: `CLIENT_PORT=80`
  - Mapped port: `3000:80 → container:80`

- **Server (Node.js backend)**  
  - Env var: `SERVER_PORT=3050`
  - Mapped port: `0.0.0.0:3050 → container:3050`

- **Redis**  
  - Env var: `REDIS_PORT=6379`
  - Mapped port: `0.0.0.0:6379 → container:6379`

- **PostgreSQL**  
  - Env var: `POSTGRES_PORT=5432`
  - Mapped port: `0.0.0.0:5432 → container:5432`
  - Credentials are read from:
    ```
    POSTGRES_USER=${POSTGRES_USER}
    POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    POSTGRES_DB=${POSTGRES_DB}
    ```
    (Defaults: `user` / `pass` / `mydb`)

- **Keycloak**  
  - Env var: `KEYCLOAK_PORT=8080`
  - Mapped port: `0.0.0.0:8080 → container:8080`
  - Admin user: `admin`  
    Admin password: `admin`  
  - The realm is imported from `master-realm.json` on startup.

### Verifying the Setup
  Open a browser to `http://localhost:80`

  User with admin panel credentials: 
    Username: admin1
    Password: admin1
  
  Test user without admin role credentials:
    Username: test
    Password: test
---
