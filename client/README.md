# Task Sphere Client

This frontend is part of the Task Sphere monorepo.

Use the root README for:
- full project overview
- setup
- environment variables
- testing
- deployment
- architecture

## Client Commands

Install dependencies:

```powershell
npm install
```

Run dev server:

```powershell
npm run dev
```

Run unit/component tests:

```powershell
npm test
```

Run end-to-end tests:

```powershell
npx playwright install
npx playwright test --headed
```

## Required Frontend Environment Variables

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```
