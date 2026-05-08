# High-Level Architecture: ConnectIn

## 1. System Overview
ConnectIn is a professional social networking platform designed to facilitate user connections, content sharing, job applications, and ML-driven recommendations. It follows a two-tier architecture comprising a React SPA and a Spring Boot REST API.

## 2. Technology Stack
- **Frontend:** React (SPA), Axios, Context API.
- **Backend:** Spring Boot 3.2, Spring Data JPA, Spring Security.
- **Database:** MySQL 8.x with Flyway for schema migrations.
- **Authentication:** Stateless JWTs stored in HTTP-only, Secure, SameSite=None cookies.

## 3. Component Architecture

### Frontend (React)
- **Routing:** Centralized via `Routing.js` using `createBrowserRouter`. Routes are wrapped in an `AuthProvider` and gated by `ProtectedRoute`.
- **State Management:** `AuthContext` serves as the primary store for user identity and global session state. No external state management (Redux/Query) is utilized; data is fetched per-component.
- **API Layer:** Domain-specific Axios wrappers (Auth, Job, Post, etc.) built on a shared base configuration with `withCredentials: true`.

### Backend (Spring Boot)
- **Layered Design:** Follows a Controller -> Service -> Repository pattern.
- **Security:** `JWTAuthenticationFilter` intercepts requests to validate the cookie-based token. Business logic endpoints are scoped under `/auth/**` and administrative ones under `/admin/**`.
- **HATEOAS:** Uses `Resource` wrappers and mappers to provide discoverable API links, reducing frontend URL coupling.
- **Feed assembly:** `FeedAssembler` (in `util/`) batch-loads authors, reaction counts, and file metadata for a page of posts in a few queries (avoiding per-post N+1s). File bytes are never embedded in feed payloads — `FileUrlBuilder` emits lazy URLs pointing to `/auth/files/view/{id}`, which the frontend fetches on demand and caches.
- **Pagination:** Feed (`GET /auth/{userId}/feed`) and user search (`GET /auth/connections/registered-users`) are server-paginated (`page`/`size` params) and return envelope DTOs (`FeedPageDTO`, `UserSearchPageDTO`) carrying `hasMore` for infinite-scroll clients.

## 4. Key Subsystems

### Recommendation Engine
- **Algorithm:** Matrix Factorization using Stochastic Gradient Descent (SGD) with shuffled observed-cell updates and relative-improvement early stopping (after a minimum iteration floor).
- **Execution:** training runs out of the request path. `RecommendationScheduler` (`@EnableScheduling` on `ConnectInApplication`) fires `recommendPosts()` and `recommendJobs()` in parallel on a fixed delay — default every 3 hours (`recommendations.refresh.interval-ms`, initial delay `recommendations.refresh.initial-delay-ms`). Each method is guarded by an `AtomicBoolean` so overlapping runs are skipped, and the scheduler is single-instance only (gate with a distributed lock before scaling out). Read endpoints (`/auth/jobs/recommend-jobs`, `/auth/{userId}/recommended-posts`) only return precomputed rows.
- **Inputs:** the user-item interaction matrix is built from:
    - Skill-to-Job Title Levenshtein distance.
    - Connection graph weights.
    - User interaction signals (views, reactions).
- **Storage:** Results are persisted in `job_recommendation` and `post_recommendation` tables. Each user's row set is rewritten atomically per user (delete + saveAll inside a `TransactionTemplate`) so readers never observe a partial state.

### Communication & Real-Time
- **Mechanism:** Short-polling via `setInterval`.
    - **Chat:** 3-second interval for active conversations.
    - **Notifications:** 60-second interval for badge counts.
- **Storage:** Messages are stored in a flat `messages` table; files/attachments are stored as BLOBs (< 2MB) in MySQL.

## 5. Data Model (Core Entities)
- **User Identity:** `User`, `Role`, `PersonalInfo`.
- **Professional Data:** `Experience`, `Education`, `Skill`.
- **Social:** `Post`, `Comment`, `Reaction`, `Connection` (PENDING/ACCEPTED status).
- **Career:** `JobPost`, `JobApplication`, `JobView`.

## 6. Architectural Constraints & Risks
- **Scalability:** - N+1 patterns in the feed were mitigated by `FeedAssembler` (batched author/file/reaction fetches); job listing paths still have hotspots.
    - Matrix Factorization is performed in-memory on a single instance, limiting the system to a few thousand concurrent users/items. The scheduler must be gated by a distributed lock before scaling the backend horizontally.
- **Persistence:** Storing binary files in MySQL increases DB size and impacts backup/restore performance. Feed responses no longer inline Base64 blobs — images are served with HTTP cache headers via `/auth/files/view/{id}`, shrinking payloads substantially.
- **User Experience:** Forced logouts occur every hour due to the lack of a JWT refresh token mechanism.
- **Performance:** Complex filtering and sorting are often handled in Java collections rather than optimized SQL queries.