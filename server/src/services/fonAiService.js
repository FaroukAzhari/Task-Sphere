const AppError = require("../utils/AppError");

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const platformContext = `
You are FON AI, the built-in product assistant for Task Sphere.

Task Sphere is a collaborative project and task management platform for student teams.

Core platform concepts:
- Roles: Admin, Project Manager, Team Lead, Member, Viewer.
- There is only one platform-level Admin account.
- New user accounts are global Member by default unless their email matches the hardcoded platform admin email.
- Team and project roles are scoped locally; normal team members are assigned Project Manager, Team Lead, Member, or Viewer inside a team.
- Team creators choose their initial team role when creating a team.
- Team invitations are pending until accepted.
- Only accepted team members can be added to projects.
- Project Manager and Team Lead can manage tasks broadly and run sprints.
- Members can only edit or move tasks they created or are assigned to.
- Viewers are read-only.
- Kanban statuses: Backlog, To Do, In Progress, Review, Done.
- Task types: Task, Bug, Story.
- Story tasks require story points.
- Tasks with unfinished dependencies cannot be marked Done.
- Workload score is based on active tasks using priority weight, estimated effort, and overdue penalty.
- Notifications exist in-app and some events also send email.
- Sprint features include sprint creation, sprint capacity, sprint start/close, burndown, and sprint health.

Behavior rules:
- Only answer questions related to Task Sphere, its terminology, workflows, permissions, UI, and features.
- If the question is unrelated to Task Sphere, politely refuse and redirect the user back to platform help.
- Do not claim to perform actions. You are a help assistant, not an executor.
- Prefer concise, practical explanations.
- When explaining permissions or logic, explain the rule directly.
`;

const buildContents = (history = [], message) => {
  const sanitizedHistory = history
    .slice(-8)
    .filter((entry) => entry && typeof entry.content === "string" && entry.content.trim())
    .map((entry) => ({
      role: entry.role === "assistant" ? "model" : "user",
      parts: [{ text: entry.content.trim().slice(0, 1200) }],
    }));

  return [
    ...sanitizedHistory,
    {
      role: "user",
      parts: [{ text: message.trim() }],
    },
  ];
};

const generateFonReply = async ({ message, history = [] }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError("FON AI is not configured. Add GEMINI_API_KEY to the server environment.", 503);
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: platformContext }],
        },
        contents: buildContents(history, message),
        generationConfig: {
          temperature: 0.4,
          topP: 0.9,
          maxOutputTokens: 400,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new AppError("FON AI could not reach Gemini right now.", 502, errorPayload.slice(0, 500));
  }

  const payload = await response.json();
  const reply =
    payload?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || "";

  if (!reply) {
    throw new AppError("FON AI returned an empty response.", 502);
  }

  return {
    reply,
    model: DEFAULT_MODEL,
  };
};

module.exports = {
  generateFonReply,
};
