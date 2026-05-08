# ConnectIn Database Schema

MySQL 8.x schema managed by Flyway (`src/main/resources/db/migration/`, V1–V22). Below are the effective table definitions after all migrations have been applied.

## Entity Relationship Overview

```
users ─┬─< user_roles >─ roles
       ├─< files
       ├─< posts ─┬─< comments
       │          ├─< reactions
       │          ├─< post_view
       │          └─< post_recommendation
       ├─< connections (self-ref via user_id_1, user_id_2)
       ├─< personal_info ─┬─< experience
       │                  ├─< skill
       │                  └─< education
       ├─< notification (self-ref via user_id, connection_user_id)
       ├─< messages (self-ref via sender_id, receiver_id)
       ├─< job_post ─┬─< job_application
       │             ├─< job_view
       │             └─< job_recommendation
       └─< post_recommendation
```

---

## 1. `users`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `BIGINT` | PK, `AUTO_INCREMENT` |
| `email` | `VARCHAR(128)` | `UNIQUE`, `NOT NULL` |
| `password` | `VARCHAR(128)` | `NOT NULL` |
| `first_name` | `VARCHAR(128)` | |
| `last_name` | `VARCHAR(128)` | |
| `phone_number` | `VARCHAR(20)` | |
| `created_date` | `TIMESTAMP` | default `CURRENT_TIMESTAMP` |
| `updated_date` | `TIMESTAMP` | default `CURRENT_TIMESTAMP` on update |

> Columns `user_role` (V1) and `photo_path` (V1) were dropped by V3 and V22 respectively.

## 2. `roles` / `user_roles`

**`roles`**

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `INT` | PK, `AUTO_INCREMENT` |
| `name` | `VARCHAR(255)` | `UNIQUE`, `NOT NULL` |

Seeded with `ROLE_ADMIN` and `ROLE_USER`.

**`user_roles`** (join table)

| Column | Type | Constraints |
| --- | --- | --- |
| `user_id` | `BIGINT` | FK → `users(id)`, composite PK |
| `role_id` | `INT` | FK → `roles(id)`, composite PK |

## 3. `files`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `VARCHAR(36)` | PK (UUID) |
| `name` | `VARCHAR(255)` | `NOT NULL` |
| `type` | `VARCHAR(100)` | `NOT NULL` |
| `data` | `LONGBLOB` | binary payload |
| `is_profile_picture` | `BOOLEAN` | `NOT NULL` (V5) |
| `user_id` | `BIGINT` | FK → `users(id)` (V9, replaced earlier `user_email` FK) |

> V7 added `post_id`; V11 removed it and moved the relation to `posts.file_id`.

## 4. `posts`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `INT` | PK, `AUTO_INCREMENT` |
| `user_id` | `BIGINT` | FK → `users(id)` ON DELETE CASCADE |
| `content` | `VARCHAR(256)` | `NOT NULL` |
| `file_id` | `VARCHAR(36)` | nullable (V11; soft-links to `files.id`, no FK constraint) |
| `created_date` | `TIMESTAMP` | default `CURRENT_TIMESTAMP` |

## 5. `comments`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `INT` | PK, `AUTO_INCREMENT` |
| `user_id` | `BIGINT` | FK → `users(id)` ON DELETE CASCADE |
| `post_id` | `INT` | FK → `posts(id)` ON DELETE CASCADE |
| `content` | `VARCHAR(256)` | `NOT NULL` |
| `created_date` | `TIMESTAMP` | default `CURRENT_TIMESTAMP` |

## 6. `reactions`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `INT` | PK, `AUTO_INCREMENT` |
| `user_id` | `BIGINT` | FK → `users(id)` ON DELETE CASCADE |
| `post_id` | `INT` | FK → `posts(id)` ON DELETE CASCADE |
| `created_date` | `TIMESTAMP` | default `CURRENT_TIMESTAMP` |
| — | — | `UNIQUE (user_id, post_id)` (V15) |

## 7. `connections`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `BIGINT` | PK, `AUTO_INCREMENT` |
| `user_id_1` | `BIGINT` | FK → `users(id)` ON DELETE CASCADE |
| `user_id_2` | `BIGINT` | FK → `users(id)` ON DELETE CASCADE |
| `status` | `ENUM('PENDING','ACCEPTED')` | |
| `created_date` | `TIMESTAMP` | default `CURRENT_TIMESTAMP` |
| `updated_date` | `TIMESTAMP` | default `CURRENT_TIMESTAMP` on update |
| — | — | `UNIQUE (user_id_1, user_id_2)` |

## 8. `personal_info`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `BIGINT` | PK, `AUTO_INCREMENT` |
| `user_id` | `BIGINT` | FK → `users(id)` ON DELETE CASCADE |

## 9. `experience`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `BIGINT` | PK, `AUTO_INCREMENT` |
| `personal_info_id` | `BIGINT` | FK → `personal_info(id)` ON DELETE CASCADE |
| `job_title` | `VARCHAR(255)` | `NOT NULL` |
| `company_name` | `VARCHAR(255)` | `NOT NULL` |
| `start_date` | `DATE` | `NOT NULL` |
| `end_date` | `DATE` | nullable |
| `is_public` | `BOOLEAN` | default `TRUE` |
| — | — | `CHECK (end_date IS NULL OR end_date >= start_date)` |

## 10. `skill`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `BIGINT` | PK, `AUTO_INCREMENT` |
| `personal_info_id` | `BIGINT` | FK → `personal_info(id)` ON DELETE CASCADE |
| `skill_title` | `VARCHAR(255)` | `NOT NULL` |
| `skill_description` | `TEXT` | `NOT NULL` |
| `is_public` | `BOOLEAN` | default `TRUE` |

## 11. `education`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `BIGINT` | PK, `AUTO_INCREMENT` |
| `personal_info_id` | `BIGINT` | FK → `personal_info(id)` ON DELETE CASCADE |
| `university_name` | `VARCHAR(255)` | `NOT NULL` |
| `field_of_study` | `VARCHAR(255)` | `NOT NULL` |
| `start_date` | `DATE` | `NOT NULL` |
| `end_date` | `DATE` | nullable |
| `is_public` | `BOOLEAN` | default `TRUE` |
| — | — | `CHECK (end_date IS NULL OR end_date >= start_date)` |

## 12. `notification`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `BIGINT` | PK, `AUTO_INCREMENT` |
| `user_id` | `BIGINT` | FK → `users(id)` (refreshed in V17) |
| `connection_user_id` | `BIGINT` | FK → `users(id)` |
| `object_id` | `BIGINT` | nullable (V18) — id of the comment/reaction/connection |
| `type` | `ENUM('COMMENT','REACTION','CONNECTION')` | `NOT NULL` |
| `created_at` | `TIMESTAMP` | default `CURRENT_TIMESTAMP` |
| — | — | `UNIQUE (user_id, connection_user_id)` |

## 13. `messages`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `BIGINT` | PK, `AUTO_INCREMENT` |
| `sender_id` | `BIGINT` | FK → `users(id)` ON DELETE CASCADE |
| `receiver_id` | `BIGINT` | FK → `users(id)` ON DELETE CASCADE |
| `content` | `TEXT` | nullable |
| `sent_at` | `TIMESTAMP` | default `CURRENT_TIMESTAMP` |

## 14. `job_post`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `BIGINT` | PK, `AUTO_INCREMENT` |
| `user_id` | `BIGINT` | FK → `users(id)` ON DELETE CASCADE |
| `job_title` | `VARCHAR(255)` | `NOT NULL` |
| `company_name` | `VARCHAR(255)` | `NOT NULL` |
| `job_description` | `TEXT` | |
| `created_at` | `TIMESTAMP` | default `CURRENT_TIMESTAMP` |

## 15. `job_application`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `BIGINT` | PK, `AUTO_INCREMENT` |
| `user_id` | `BIGINT` | FK → `users(id)` ON DELETE CASCADE |
| `job_post_id` | `BIGINT` | FK → `job_post(id)` ON DELETE CASCADE |
| `applied_at` | `TIMESTAMP` | default `CURRENT_TIMESTAMP` |

## 16. `job_view`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `BIGINT` | PK, `AUTO_INCREMENT` |
| `user_id` | `BIGINT` | FK → `users(id)` ON DELETE CASCADE |
| `job_id` | `BIGINT` | FK → `job_post(id)` ON DELETE CASCADE |
| `viewed_at` | `TIMESTAMP` | default `CURRENT_TIMESTAMP` |

## 17. `job_recommendation`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `BIGINT` | PK, `AUTO_INCREMENT` |
| `user_id` | `BIGINT` | FK → `users(id)` ON DELETE CASCADE |
| `job_id` | `BIGINT` | FK → `job_post(id)` ON DELETE CASCADE |
| `job_score` | `DECIMAL(10,2)` | |

## 18. `post_recommendation`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `BIGINT` | PK, `AUTO_INCREMENT` |
| `user_id` | `BIGINT` | FK → `users(id)` ON DELETE CASCADE |
| `post_id` | `INT` | FK → `posts(id)` ON DELETE CASCADE |
| `post_score` | `DECIMAL(10,2)` | |

## 19. `post_view`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `BIGINT` | PK, `AUTO_INCREMENT` |
| `user_id` | `BIGINT` | FK → `users(id)` ON DELETE CASCADE |
| `post_id` | `INT` | FK → `posts(id)` ON DELETE CASCADE |
| `viewed_at` | `TIMESTAMP` | default `CURRENT_TIMESTAMP` |