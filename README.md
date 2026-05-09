# 📘 ConnectIn

A LinkedIn-style professional networking app: profiles, connections, job listings, private messaging, and ML-driven feed and job recommendations.

<p align="center">
   <img src="https://img.shields.io/badge/Java_21-ED8B00?style=for-the-badge&logo=java&logoColor=white" alt="Java 21">
   <img src="https://img.shields.io/badge/Spring_Boot_3.2-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white" alt="Spring Boot 3.2">
   <img src="https://img.shields.io/badge/Spring_Security-6DB33F?style=for-the-badge&logo=spring-security&logoColor=white" alt="Spring Security">
   <img src="https://img.shields.io/badge/MySQL_8-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL 8">
   <img src="https://img.shields.io/badge/Flyway-CC0200?style=for-the-badge&logo=flyway&logoColor=white" alt="Flyway">
   <img src="https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18">
   <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios">
   <img src="https://img.shields.io/badge/Maven-C71A36?style=for-the-badge&logo=apache-maven&logoColor=white" alt="Maven">
</p>

## 🏗️ Architecture

Two-tier: a React SPA talking to a Spring Boot REST API over JWT-authenticated, HTTP-only cookies; MySQL with Flyway migrations behind it.

- [docs/architecture.md](docs/architecture.md) — high-level architecture, recommendation engine, real-time model
- [docs/api-spec.md](docs/api-spec.md) — REST endpoints
- [docs/database-schema.md](docs/database-schema.md) — entity model and tables

```
backend/    Spring Boot 3.2 REST API (Java 21, Maven)
frontend/   React 18 SPA (Create React App)
docs/       Architecture, API, and schema docs
```

## ✨ Features

- 📋 **Profiles** — personal info, work experience, education, skills.
- 🌐 **Network** — search users, send/accept connection requests.
- 🏠 **Feed** — server-paginated, infinite-scroll posts with reactions and comments.
- 💼 **Jobs** — create and apply to job posts; personalized recommendations.
- 💬 **Chat** — private messages between connected users (3s short-polling).
- 🔔 **Notifications** — connection requests, reactions, comments (60s polling).
- 👑 **Admin** — user management with JSON/XML export.

### 🧠 Recommendations

Both feed posts and jobs are scored via **Matrix Factorization** (SGD with early stopping). Training runs out of the request path on a scheduler (default every 3 hours); read endpoints only serve precomputed rows. Inputs include user reactions, the connection graph, post views, and skill-to-job-title Levenshtein distance. See [docs/architecture.md](docs/architecture.md#recommendation-engine) for details.

## 🚀 Getting Started

### Prerequisites

- Java 21
- Maven 3.9+ (or use the bundled `./mvnw`)
- MySQL 8.0+ on `localhost:3306` (the `connectIn` database is created automatically)
- Node.js 18+ and npm

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

Default port `8080`. Configure via environment variables (all optional for local dev):

| Variable | Default | Purpose |
|---|---|---|
| `MYSQLHOST` / `MYSQLPORT` / `MYSQLUSER` / `MYSQLPASSWORD` / `MYSQLDATABASE` | localhost / 3306 / root / – / connectIn | MySQL connection |
| `JWT_SECRET` | dev key | HMAC SHA-256, min 64 chars |
| `ALLOWED_ORIGINS` | `http://localhost:3000,https://localhost:3000` | CORS allow-list |
| `PORT` | `8080` | Server port |

Spring properties of note: `recommendations.refresh.interval-ms` (default 3h) and `recommendations.refresh.initial-delay-ms` (default 5s).

A default admin is seeded on first run: **`admin@example.com` / `admin123`**.

### Frontend

```bash
cd frontend
npm install
npm start
```

Runs on `https://localhost:3000` using the bundled self-signed cert (`server.cert` / `server.key`). To silence Chrome's localhost warning:

```
chrome://flags/#allow-insecure-localhost
```
