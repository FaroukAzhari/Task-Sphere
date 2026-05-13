const normalizeValidationErrors = (errors = []) =>
  errors.map((error) => ({
    field: error.path || error.param || error.field || null,
    message: error.msg || error.message || "Invalid value",
    value: error.value,
    location: error.location || null,
  }));

const normalizeMongooseValidationErrors = (errors = {}) =>
  Object.entries(errors).map(([field, error]) => ({
    field,
    message: error.message || "Invalid value",
    value: error.value,
    location: "body",
  }));

const normalizeDuplicateKeyErrors = (keyValue = {}) =>
  Object.entries(keyValue).map(([field, value]) => ({
    field,
    message: `${field === "email" ? "This email is already registered." : `${field} is already in use.`}`,
    value,
    location: "body",
  }));

const inferErrorCode = ({ message = "", statusCode = 500, fallback = "INTERNAL_ERROR" } = {}) => {
  const normalized = String(message).toLowerCase();

  if (normalized.includes("email already exists")) return "EMAIL_ALREADY_EXISTS";
  if (normalized.includes("invalid credentials")) return "INVALID_CREDENTIALS";
  if (normalized.includes("password must be at least")) return "PASSWORD_TOO_SHORT";
  if (normalized.includes("valid email")) return "INVALID_EMAIL";
  if (normalized.includes("you must sign in")) return "AUTH_REQUIRED";
  if (normalized.includes("invalid token") || normalized.includes("session")) return "SESSION_INVALID";
  if (normalized.includes("forbidden") || normalized.includes("permission")) return "FORBIDDEN";
  if (normalized.includes("not found")) return "NOT_FOUND";
  if (normalized.includes("deadline cannot be earlier than today")) return "PROJECT_DEADLINE_PAST";
  if (normalized.includes("already a team member")) return "TEAM_MEMBER_EXISTS";
  if (normalized.includes("pending invite")) return "TEAM_INVITE_PENDING";
  if (normalized.includes("already in this project")) return "PROJECT_MEMBER_EXISTS";
  if (normalized.includes("must belong to the project team")) return "PROJECT_MEMBER_NOT_IN_TEAM";
  if (normalized.includes("story tasks require storypoints")) return "STORY_POINTS_REQUIRED";
  if (normalized.includes("blocked by unfinished dependencies")) return "TASK_BLOCKED_BY_DEPENDENCIES";
  if (normalized.includes("blocked by dependencies")) return "TASK_BLOCKED_BY_DEPENDENCIES";
  if (normalized.includes("duplicate")) return "DUPLICATE_VALUE";
  if (normalized.includes("validation failed")) return "VALIDATION_ERROR";
  if (normalized.includes("invalid resource id")) return "INVALID_RESOURCE_ID";
  if (normalized.includes("fon ai is not configured")) return "FON_AI_NOT_CONFIGURED";
  if (normalized.includes("fon ai could not reach gemini")) return "FON_AI_UNAVAILABLE";
  if (normalized.includes("fon ai returned an empty response")) return "FON_AI_EMPTY_RESPONSE";

  if (statusCode === 400) return "BAD_REQUEST";
  if (statusCode === 401) return "AUTH_REQUIRED";
  if (statusCode === 403) return "FORBIDDEN";
  if (statusCode === 404) return "NOT_FOUND";
  if (statusCode === 409) return "CONFLICT";

  return fallback;
};

const getUserFacingMessage = ({ message = "", statusCode = 500 } = {}) => {
  const normalized = String(message).trim().toLowerCase();

  if (normalized === "forbidden") return "You do not have permission to perform this action.";
  if (normalized === "unauthorized") return "You must sign in to continue.";
  if (normalized === "invalid credentials") return "Incorrect email or password.";
  if (normalized === "email already exists") return "This email is already registered.";

  if (statusCode === 500 && (!message || normalized === "internal server error")) {
    return "Something went wrong on our side. Please try again.";
  }

  return message;
};

module.exports = {
  normalizeValidationErrors,
  normalizeMongooseValidationErrors,
  normalizeDuplicateKeyErrors,
  inferErrorCode,
  getUserFacingMessage,
};
