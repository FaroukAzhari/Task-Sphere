# Backend Architecture

## Folder Layout

- `src/config`: database configuration
- `src/constants`: shared enums
- `src/controllers`: request handlers
- `src/middleware`: auth, validation, error handling
- `src/models`: Mongoose schemas
- `src/routes`: route modules
- `src/services`: domain services (analytics rules, history, notifications)
- `src/sockets`: Socket.IO server setup
- `src/utils`: helpers (responses, JWT, pagination)
- `src/scripts`: seed and data generation scripts

## Core Design Decisions

- Express modules are separated by domain (`auth`, `teams`, `projects`, `tasks`, `notifications`, `analytics`).
- Responses are normalized through `sendSuccess`/`sendError`.
- Task intelligence is rule-based: no ML dependency.
- Task history and activity logs are persisted for traceability.
- Socket events are scoped with project/user rooms.

## Smart Features

### Workload Balancing

Workload score uses:

- active task count
- task priority weighting
- estimated effort
- overdue penalty

States:

- underloaded
- balanced
- overloaded

### Deadline Risk Alerts

Risk scoring considers:

- due-date proximity and overdue status
- subtask completion ratio
- unfinished dependency count

Risk levels:

- Low
- Medium
- High
