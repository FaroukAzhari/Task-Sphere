# Task Sphere

Task Sphere is a production-style collaborative task and project management platform for student teams. It combines Kanban workflow, real-time collaboration, analytics dashboards, workload balancing, and deadline risk alerts.

## Tech Stack

- Frontend: React + Vite, Tailwind CSS, React Router, Axios, TanStack Query, dnd-kit, Recharts, Socket.IO client
- Backend: Node.js, Express, Mongoose, JWT, bcrypt, Socket.IO, express-validator
- Database: MongoDB
- Testing: Jest + Supertest, Vitest + React Testing Library, Playwright

## Monorepo Structure

- `client/` React frontend
- `server/` Express backend
- `docs/` architecture, API, and schema notes

## Quick Start

1. Install dependencies:
   - `cd server && npm install`
   - `cd ../client && npm install`
2. Configure env files:
   - `server/.env` from `server/.env.example`
   - `client/.env` from `client/.env.example`
3. Run backend:
   - `cd server && npm run dev`
4. Run frontend:
   - `cd client && npm run dev`
5. Seed demo data (optional):
   - `cd server && npm run seed`

## Demo Accounts (after seed)

- `admin@tasksphere.dev` / `password123`
- `maya@tasksphere.dev` / `password123`
- `omar@tasksphere.dev` / `password123`

## Key Features

- JWT authentication and profile management
- Team and project management
- Drag-and-drop Kanban board with optimistic updates
- Task comments, subtasks, dependencies, and task history
- Real-time project updates and notifications via Socket.IO
- Dashboard and analytics charts
- Workload balancing indicator and rule-based deadline risk alerts
- Role-aware backend checks and protected frontend routes

## Testing

- Backend: `cd server && npm test`
- Frontend unit tests: `cd client && npm test`
- E2E: `cd client && npm run test:e2e`

## Future Improvements

- File uploads for task attachments
- Rich dependency graph visualization
- Advanced permission matrix editor
- CI pipeline + coverage thresholds
- Offline-first client caching
