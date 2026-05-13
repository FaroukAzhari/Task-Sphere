# Task Sphere

Task Sphere is a collaborative project and task management platform for student engineering teams. It combines a Kanban board, sprint execution, real-time updates, scoped analytics, project communication, and rule-based delivery intelligence in one full-stack system.

The product is designed as a lightweight Scrum + Kanban hybrid:
- teams can plan sprint scope explicitly
- the board remains live during a sprint
- sprint burndown only tracks sprint-allocated items
- new work created during an active sprint stays visible on the board but does not affect sprint metrics unless deliberately assigned to that sprint

## Core Stack

### Frontend
- React 19
- Vite
- React Router
- Axios
- TanStack Query
- dnd-kit
- Recharts
- Framer Motion
- Tailwind CSS
- Socket.IO client

### Backend
- Node.js
- Express
- Mongoose
- JWT authentication
- bcryptjs
- Socket.IO
- express-validator
- Nodemailer

### Database
- MongoDB

### Testing
- Jest + Supertest for backend API tests
- Vitest + React Testing Library for frontend/component tests
- Playwright for end-to-end browser tests

## Monorepo Structure

```txt
task-sphere/
  client/   React frontend
  server/   Express backend
  docs/     architecture, API, schema notes
  README.md
```

## Main Features

### Authentication and Profiles
- register / login / logout
- JWT-based protected routes
- password hashing with bcryptjs
- user settings and personalization
- avatar image upload (`.png` / `.jpeg`)
- notification preference controls

### Team and Project Management
- create teams
- invite existing registered users into teams
- pending invitation acceptance / decline flow
- add accepted team members into projects
- assign project roles and project member labels

### Role Model

There are two role scopes in the system.

#### Platform scope
- `Platform Admin`
- `Platform Member`

Only one platform admin is intended. It is determined by:

```env
PLATFORM_ADMIN_EMAIL=admin@tasksphere.dev
```

All other users are global platform members.

#### Team / project scope
- `Project Manager`
- `Team Lead`
- `Member`
- `Viewer`

Notes:
- a user may be a platform member globally and still be a project manager or team lead inside a team/project
- only one `Team Lead` is allowed per team
- pending team invitees are not treated as active members until they accept

### Task and Work Item Management
- work item types:
  - `Task`
  - `Bug`
  - `Story`
- status workflow:
  - `Backlog`
  - `To Do`
  - `In Progress`
  - `Review`
  - `Done`
- assignee, creator, due date, priority
- story points for stories
- estimated effort for tasks / bugs
- labels
- dependencies
- subtasks
- comments
- task history / change tracking
- blocked dependency protection before moving to `Done`

### Kanban Board
- drag and drop task movement
- optimistic UI updates
- real-time sync via Socket.IO
- task search and filtering
- assignee / priority / type filters
- task detail modal
- sprint scope labels on board items

### Sprint Module
- create sprint
- select sprint scope (`taskIds`)
- start sprint
- close sprint
- burndown snapshots
- sprint scope explanation in the UI

Sprint point logic:
- story => `storyPoints`
- task / bug => `estimatedEffort`
- fallback if effort is not set => `1`

### Dashboard and Analytics

Analytics are explicitly scoped and no longer silently mix unrelated projects.

Supported scopes:
- `My Work`
- `Team`
- `Project`

Dashboard defaults to:
- `My Work`

Analytics page defaults to:
- `Project`

Metrics include:
- personal work console
- blocked items
- due soon
- review queue
- workload distribution
- priority distribution
- completion trends
- sprint health
- upcoming deadlines
- overdue tasks

### Project Timeline and Collaboration
- roadmap timeline
- Gantt-style project timeline
- project hub with:
  - discussion feed
  - pinned updates
  - shared document metadata + links

### Notifications
- in-app notifications
- unread badge
- real-time Socket.IO delivery
- notification center
- mark read / mark all read

Email notifications are supported through SMTP for selected notification types.

### FON AI
- Gemini-backed assistant
- server-side API key handling
- read-only product help assistant for platform-related questions

## Smart Rule-Based Features

### Workload Balancing
Workload score is based on:
- active task count
- priority weighting
- estimated effort
- overdue penalty

States:
- `underloaded`
- `balanced`
- `overloaded`

### Deadline Risk Alerts
Risk logic considers:
- due date proximity
- overdue status
- subtask completion ratio
- unresolved dependencies

Risk levels:
- `Low`
- `Medium`
- `High`

## Date Logic

The UI and backend both enforce current-day date rules.

Examples:
- project deadline cannot be earlier than the current day
- task due date cannot be earlier than the current day
- sprint dates cannot be earlier than the current day
- sprint end date cannot be before sprint start date

These checks are dynamic and based on the current runtime date, not hardcoded calendar values.

## Environment Setup

### Backend `.env`

Create `server/.env` based on `server/.env.example`.

Example:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/task_sphere
JWT_SECRET=change_me_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
PLATFORM_ADMIN_EMAIL=admin@tasksphere.dev

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

### Frontend `.env`

Create `client/.env` based on `client/.env.example`.

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Local Setup

### Prerequisites
- Node.js LTS
- npm
- MongoDB local server or MongoDB Atlas

### Install dependencies

Backend:

```powershell
cd server
npm install
```

Frontend:

```powershell
cd client
npm install
```

### Run locally

Backend:

```powershell
cd server
npm run dev
```

Frontend:

```powershell
cd client
npm run dev
```

## Seed Demo Data

To reseed the database:

```powershell
cd server
npm run seed
```

Important:
- this is destructive for current database content
- it resets demo data

### Seeded Demo Accounts

- `admin@tasksphere.dev` / `password123`
- `maya@tasksphere.dev` / `password123`
- `omar@tasksphere.dev` / `password123`
- `lina@tasksphere.dev` / `password123`
- `sara@tasksphere.dev` / `password123`

Platform admin behavior depends on:

```env
PLATFORM_ADMIN_EMAIL=admin@tasksphere.dev
```

## Testing

### Backend tests

Runs Jest + Supertest.

```powershell
cd server
npm test
```

### Frontend tests

Runs Vitest + React Testing Library.

```powershell
cd client
npm test
```

### Playwright end-to-end tests

Playwright tests require:
- Playwright browser binaries installed
- backend running
- frontend running

Install Playwright browser binaries once:

```powershell
cd client
npx playwright install
```

Run backend and frontend in separate terminals:

```powershell
cd server
npm run dev
```

```powershell
cd client
npm run dev
```

Then run E2E tests:

```powershell
cd client
npx playwright test --headed
```

Notes:
- Playwright tests validate browser flows, not server stress performance
- if `page.goto("/projects")` fails, the frontend, backend, auth flow, or base URL setup should be checked first

## API Summary

Base URL:

```txt
/api
```

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`

### Users
- `GET /users`
- `PATCH /users/me`

### Teams
- `GET /teams`
- `POST /teams`
- `POST /teams/:teamId/invite`
- `POST /teams/:teamId/invitations/:userId/accept`
- `POST /teams/:teamId/invitations/:userId/decline`
- `PATCH /teams/:teamId/members/:memberUserId/role`

### Projects
- `GET /projects`
- `GET /projects/:projectId`
- `GET /projects/:projectId/overview`
- `POST /projects`
- `PATCH /projects/:projectId`
- `POST /projects/:projectId/members`
- `PATCH /projects/:projectId/members/:memberUserId/label`

### Project Hub
- `GET /projects/:projectId/hub/discussions`
- `POST /projects/:projectId/hub/discussions`
- `PATCH /projects/:projectId/hub/discussions/:entryId/pin`
- `GET /projects/:projectId/hub/documents`
- `POST /projects/:projectId/hub/documents`
- `PATCH /projects/:projectId/hub/documents/:documentId`
- `DELETE /projects/:projectId/hub/documents/:documentId`

### Sprints
- `GET /projects/:projectId/sprints`
- `POST /projects/:projectId/sprints`
- `PATCH /projects/:projectId/sprints/:sprintId/start`
- `PATCH /projects/:projectId/sprints/:sprintId/close`
- `GET /projects/:projectId/sprints/:sprintId/burndown`

### Tasks
- `GET /tasks`
- `GET /tasks/:taskId`
- `POST /tasks`
- `PATCH /tasks/:taskId`
- `PATCH /tasks/:taskId/move`
- `POST /tasks/:taskId/comments`
- `POST /tasks/:taskId/subtasks`
- `PATCH /tasks/subtasks/:subtaskId/toggle`

### Notifications
- `GET /notifications`
- `PATCH /notifications/:notificationId/read`
- `PATCH /notifications/read-all`

### Analytics
- `GET /analytics/dashboard?scope=my`
- `GET /analytics/dashboard?scope=team&teamId=...`
- `GET /analytics/dashboard?scope=project&projectId=...`

### AI
- `POST /ai/chat`

## Error Handling

The backend returns structured user-readable errors.

Error responses include:
- `message`
- `errorCode`
- `errors`
- `meta`

The frontend uses:
- field-level inline errors for forms
- banners / toasts for action failures

Examples:
- duplicate email
- invalid credentials
- invalid story points
- forbidden role actions
- pending invite not accepted
- blocked dependency prevents `Done`
- invalid date selection

## Deployment Outline

Recommended deployment split:
- frontend => Netlify
- backend => Render
- database => MongoDB Atlas

High-level steps:
1. create MongoDB Atlas cluster and connection string
2. deploy backend as Render web service from `server/`
3. set backend environment variables
4. deploy frontend on Netlify from `client/`
5. set frontend environment variables
6. add SPA redirect rule for React Router
7. update backend `CLIENT_URL` to the real frontend URL

Frontend production env:

```env
VITE_API_URL=https://your-backend-url/api
VITE_SOCKET_URL=https://your-backend-url
```

Backend production env must include:
- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- optional SMTP settings
- optional Gemini settings

## Documentation References

See:
- [architecture.md](c:\Users\user\Documents\task-sphere\docs\architecture.md)
- [api.md](c:\Users\user\Documents\task-sphere\docs\api.md)
- [database-schema.md](c:\Users\user\Documents\task-sphere\docs\database-schema.md)

## Current Limitations / Practical Notes

- document storage currently supports metadata + links, not binary file hosting
- task attachments are still placeholders
- some charts are summary-level and can be expanded further
- frontend test/build behavior may depend on local Vite / esbuild environment permissions on some Windows setups
- stress testing is not part of Playwright; use a separate load-testing tool such as `k6` if needed

## Suggested Future Improvements

- binary file upload storage for project hub and task attachments
- richer dependency graph visualization
- CI pipeline with automated test execution
- stronger coverage thresholds
- explicit sprint scope change tracking
- exportable reports by analytics scope
- more granular role matrix editor
