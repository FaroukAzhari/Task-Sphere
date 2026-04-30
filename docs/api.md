# API Overview

Base URL: `/api`

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`

## Users

- `GET /users` (admin/pm)
- `PATCH /users/me` (supports profile personalization fields like `headline`, `location`, `focusMode`, `accentColor`)

## Teams

- `GET /teams`
- `POST /teams`
- `POST /teams/:teamId/invite` (creates in-app notification + sends email when SMTP and user preference allow)
- `PATCH /teams/:teamId`

## Projects

- `GET /projects`
- `GET /projects/:projectId`
- `GET /projects/:projectId/overview`
- `POST /projects`
- `PATCH /projects/:projectId`

## Tasks

- `GET /tasks?projectId=...&status=&priority=&assignee=&search=&page=&limit=`
- `GET /tasks/:taskId`
- `POST /tasks`
- `PATCH /tasks/:taskId`
- `PATCH /tasks/:taskId/move`
- `POST /tasks/:taskId/comments`
- `POST /tasks/:taskId/subtasks`
- `PATCH /tasks/subtasks/:subtaskId/toggle`

## Notifications

- `GET /notifications`
- `PATCH /notifications/:notificationId/read`
- `PATCH /notifications/read-all`

## Analytics

- `GET /analytics/dashboard`

## Response Contract

Success:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "meta": { "timestamp": "..." }
}
```

Failure:

```json
{
  "success": false,
  "message": "...",
  "errors": []
}
```
