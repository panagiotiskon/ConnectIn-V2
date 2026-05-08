# ConnectIn API Specification

This document enumerates every REST endpoint exposed by the Spring Boot backend. Endpoints are grouped by controller (`back/src/main/java/backend/connectin/web/controllers/`).

## Authorization Overview

Authorization rules are defined in `security/SecurityConfig.java`:

| Path Pattern | Access |
| --- | --- |
| `/auth/login`, `/auth/register`, `/auth/validate-email` | Public |
| `/auth/**` (everything else) | Authenticated (JWT cookie) |
| `/admin/**` | **Requires `ROLE_ADMIN`** |
| `OPTIONS /**` | Permitted (CORS preflight) |

Sessions are stateless; the JWT is extracted from an HTTP-only cookie by `JWTAuthenticationFilter`.

---

## 1. AuthController — `/auth`

| Method | Path | Request Body / Params | Response | Auth |
| --- | --- | --- | --- | --- |
| `POST` | `/auth/login` | `UserLoginRequest` (JSON: `email`, `password`) | `AuthResource` + `Set-Cookie: accessToken=...` | Public |
| `POST` | `/auth/logout` | — | `String` "Logged out successfully" + empty cookie | Authenticated |
| `POST` | `/auth/register` | `multipart/form-data`: `email`, `password`, `firstName`, `lastName`, `phoneNumber?`, `profilePicture?` (built into `UserRegisterRequest`) | `AuthResource` + `Set-Cookie` | Public |
| `POST` | `/auth/validate-email` | raw `String` email (request body) | `Map<String, Boolean>` — `{"isValid": true/false}` (409 on conflict) | Public |
| `GET` | `/auth/current-user` | — (uses `Principal`) | `UserDTO` | Authenticated |

---

## 2. UserController — `/auth`

### Account

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `POST` | `/auth/{userId}/change-password` | `UserChangePasswordRequest` | `String` "Password changed" (+ clears cookie) |
| `POST` | `/auth/{userId}/change-email` | `UserChangeEmailRequest` | `String` "Email changed" (+ clears cookie) |
| `GET`  | `/auth/{userId}` | — | `UserDTO` |

### Personal Info — Education / Experience / Skills

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET`    | `/auth/{userId}/personal-info/education` | — | `List<EducationDTO>` |
| `POST`   | `/auth/{userId}/personal-info/education` | `EducationDTO` | `List<EducationDTO>` |
| `DELETE` | `/auth/{userId}/personal-info/educations/{educationId}` | — | 200 (void) |
| `GET`    | `/auth/{userId}/personal-info/experience` | — | `List<ExperienceDTO>` |
| `POST`   | `/auth/{userId}/personal-info/experience` | `ExperienceDTO` | `List<ExperienceDTO>` |
| `DELETE` | `/auth/{userId}/personal-info/experiences/{experienceId}` | — | 200 (void) |
| `GET`    | `/auth/{userId}/personal-info/skills` | — | `List<SkillDTO>` |
| `POST`   | `/auth/{userId}/personal-info/skills` | `SkillDTO` | `List<SkillDTO>` |
| `DELETE` | `/auth/{userId}/personal-info/skills/{skillId}` | — | 200 (void) |

### Feed & Posts

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET`    | `/auth/{userId}/feed` | query `page?` (default 0), `size?` | `FeedPageDTO` — `{items: PostResourceDetailed[], page, size, total, hasMore}` |
| `GET`    | `/auth/{userId}/posts` | — | `List<PostResourceDetailed>` |
| `POST`   | `/auth/{userId}/create-post` | `multipart/form-data`: `content`, `file?` | `String` "Post Created" |
| `DELETE` | `/auth/{userId}/{postId}` | — | `String` "Post Deleted" |

> `PostResourceDetailed` now embeds `author: FeedAuthorDTO` (id, firstName, lastName, profilePictureUrl) and `file: FileMetaDTO` (id, type, name, url) instead of a raw file payload. Comments inside the feed also carry an `author` field. Image/file bytes are fetched lazily via the new inline URL (see §4).

### Comments

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `POST`   | `/auth/{userId}/{postId}/create-comment` | `CommentRequest` | `Long` (new comment id) |
| `GET`    | `/auth/{userId}/comments` | — | `Map<Long, List<Long>>` (postId → list of commentIds) |
| `DELETE` | `/auth/{userId}/{postId}/{commentId}` | — | `String` "Comment Deleted" |

### Reactions

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `POST`   | `/auth/{userId}/{postId}/create-reaction` | — | `Long` (new reaction id) |
| `GET`    | `/auth/{userId}/reactions` | — | `List<Long>` (post ids the user reacted to) |
| `DELETE` | `/auth/{userId}/{postId}/reaction` | — | `String` "Reaction Deleted" |

---

## 3. ConnectionController — `/auth/connections`

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET`    | `/auth/connections/{userId}` | — | `List<ConnectedUserDTO>` |
| `GET`    | `/auth/connections/pending/{userId}` | — | `List<ConnectedUserDTO>` |
| `POST`   | `/auth/connections/{userId}` | query `connectionUserId` | `List<Connection>` (201) |
| `GET`    | `/auth/connections/registered-users` | query `search?`, `userId`, `page?` (default 0), `size?` (default 20) | `UserSearchPageDTO` — `{content: RegisteredUserDTO[], page, size, hasMore}` |
| `DELETE` | `/auth/connections/{userId}` | query `connectionUserId` | `String` "Successfully deleted" |

---

## 4. FileController — `/auth`

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `POST`   | `/auth/pre-upload` | `multipart`: `file` | `Map<String,String>` with `tempId`, `fileName` (held in in-memory `tempStorage`) |
| `POST`   | `/auth/upload` | `multipart`: `file`, `isProfilePicture` (String), `userId` | `String` status message |
| `GET`    | `/auth/files` | — | `List<FileResource>` (name, uri, type, size) |
| `GET`    | `/auth/files/{id}` | — | `byte[]` (attachment download) |
| `GET`    | `/auth/files/view/{id}` | — | `byte[]` inline with correct `Content-Type` and `Cache-Control: private, max-age=7d`. This is the URL embedded in feed `FileMetaDTO.url` / `FeedAuthorDTO.profilePictureUrl`. |
| `GET`    | `/auth/files/user/{userId}/images` | — | `List<Map<String,String>>` — `{type, data (Base64)}` |
| `DELETE` | `/auth/files/{id}` | — | `String` status |

---

## 5. JobController — `/auth/jobs`

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `POST`   | `/auth/jobs/post` | query `userId`, `jobTitle`, `companyName`, `jobDescription` | `JobPost` |
| `POST`   | `/auth/jobs/apply` | query `userId`, `jobPostId` | 200 (void) |
| `GET`    | `/auth/jobs/posts` | query `currentUserId` | `List<JobPostDTO>` (sorted by `createdAt` desc) |
| `GET`    | `/auth/jobs/applications` | query `userId` | `List<JobApplicationDTO>` |
| `DELETE` | `/auth/jobs/delete` | query `userId`, `jobPostId` | 200 (void) |

---

## 6. JobRecommendationController — `/auth/jobs`

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `POST` | `/auth/jobs/view-job` | query `userId`, `jobId` | `JobView` |
| `GET`  | `/auth/jobs/recommend-jobs` | query `userId` | `List<JobPostDTO>` — reads precomputed rows from `job_recommendation`; training runs out-of-band on `RecommendationScheduler`'s fixed-delay job (see architecture §4) |

---

## 7. MessageController — `/auth/messages`

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `POST` | `/auth/messages/send` | query `senderId`, `receiverId`, `content` | `Message` |
| `GET`  | `/auth/messages/conversation` | query `userId1`, `userId2` | `List<MessageDTO>` |
| `POST` | `/auth/messages/conversation` | query `userId1`, `userId2` | 200 (void) |
| `GET`  | `/auth/messages/conversations` | query `currentUserId` | `List<ConversationDTO>` |

---

## 8. NotificationController — `/auth/notifications`

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `POST`   | `/auth/notifications/create` | `NotificationRequest` (`userId`, `type`, `connectionUserId`, `objectId`) | `Notification` (201) |
| `GET`    | `/auth/notifications/{userId}` | — | `List<NotificationResource>` |
| `GET`    | `/auth/notifications/{userId}/count` | — | `Long` |
| `PUT`    | `/auth/notifications/{userId}/accept/{notificationId}` | — | 200 (void) |
| `DELETE` | `/auth/notifications/{userId}/decline/{notificationId}` | — | 200 (void) |
| `DELETE` | `/auth/notifications/delete` | query `notificationId?`, `userId?`, `connectedUserId?`, `objectId?` | `String` "Notification Deleted Successfully" |

---

## 9. PostRecommendationController — `/auth`

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `POST` | `/auth/view-post` | query `userId`, `postId` | `PostView` |
| `GET`  | `/auth/{userId}/recommended-posts` | query `page?` (default 0), `size?` | `List<PostResourceDetailed>` — reads precomputed rows from `post_recommendation`; training runs out-of-band on `RecommendationScheduler`'s fixed-delay job (see architecture §4) |

---

## 10. AdminController — `/admin` *(requires `ROLE_ADMIN`)*

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/admin` | — | `String` "new" |
| `GET` | `/admin/users` | — | `List<UserDTO>` |
| `GET` | `/admin/users/details` | query `userIds` (list of Long) | `Map<Long, UserDetailDTO>` |

---

## Appendix — Request / Response DTO Index

**Request objects** (`web/requests/`): `UserLoginRequest`, `UserRegisterRequest`, `UserChangePasswordRequest`, `UserChangeEmailRequest`, `PostRequest`, `CommentRequest`, `NotificationRequest`.

**DTOs** (`web/dto/`): `UserDTO`, `UserDetailDTO`, `RegisteredUserDTO`, `ConnectedUserDTO`, `EducationDTO`, `ExperienceDTO`, `SkillDTO`, `JobPostDTO`, `JobApplicationDTO`, `MessageDTO`, `ConversationDTO`, `FeedPageDTO`, `FeedAuthorDTO`, `FileMetaDTO`, `UserSearchPageDTO`.

**HATEOAS resources** (`web/resources/`): `AuthResource`, `PostResource`, `PostResourceDetailed`, `CommentResource`, `ReactionResource`, `ConnectionResource`, `FileResource`, `NotificationResource`.
