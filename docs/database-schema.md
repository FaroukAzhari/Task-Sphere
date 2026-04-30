# Database Schema Summary

## Collections

- `users`
- `teams`
- `projects`
- `tasks`
- `subtasks`
- `taskcomments`
- `labels`
- `notifications`
- `activitylogs`
- `taskhistories`

## Relationships

- Team -> members[] -> User reference
- Project -> team reference + members[] user references
- Task -> project, team, assignee, creator references
- TaskComment -> task, author references
- Notification -> user reference
- ActivityLog -> actor + optional team/project/task references
- TaskHistory -> task + changedBy references

## Indexing Highlights

- User email (unique)
- Team member user id
- Project (team, name) unique
- Task status, priority, dueDate, assignee, text search
- Notification user + isRead + createdAt
- History/Activity sorted by `createdAt`

## Data Consistency Practices

- Dependency check prevents marking blocked tasks as done
- TaskHistory writes for key mutating fields
- ActivityLog emits timeline entries for major actions
- Notification service centralizes notification creation

## User Notification Preferences

- `users.notificationPreferences.emailEnabled`
- `users.notificationPreferences.taskAssigned`
- `users.notificationPreferences.sprintUpdates`
- `users.notificationPreferences.mentions`
- `users.notificationPreferences.teamInvites`

## User Personalization Fields

- `users.headline`
- `users.location`
- `users.focusMode` (`Builder | Planner | Reviewer | Researcher`)
- `users.accentColor` (hex color like `#0f8b8d`)
