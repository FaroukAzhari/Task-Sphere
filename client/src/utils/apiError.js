const fallbackSummary = "Something went wrong. Please try again.";

const humanizeField = (field) => {
  const normalized = String(field || "").replace(/\./g, " ").replace(/([A-Z])/g, " $1").trim();
  if (!normalized) return "Field";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export const normalizeApiError = (error, fallback = fallbackSummary) => {
  if (!error?.response) {
    return {
      summary: error?.message || "Could not reach the server. Check your connection and try again.",
      errorCode: "NETWORK_ERROR",
      status: null,
      fieldErrors: {},
      details: [],
    };
  }

  const payload = error.response.data || {};
  const details = Array.isArray(payload.errors) ? payload.errors : [];
  const fieldErrors = {};

  details.forEach((item) => {
    if (!item?.field) return;
    if (!fieldErrors[item.field]) fieldErrors[item.field] = [];
    fieldErrors[item.field].push(item.message || "Invalid value");
  });

  if (!details.length && payload.errors && typeof payload.errors === "object" && !Array.isArray(payload.errors)) {
    Object.entries(payload.errors).forEach(([field, value]) => {
      const messages = Array.isArray(value) ? value : [String(value)];
      fieldErrors[field] = messages;
    });
  }

  return {
    summary: payload.message || fallback,
    errorCode: payload.errorCode || "UNKNOWN_ERROR",
    status: error.response.status || null,
    fieldErrors,
    details: details.length
      ? details
      : Object.entries(fieldErrors).flatMap(([field, messages]) =>
          messages.map((message) => ({ field, message }))
        ),
  };
};

export const firstFieldError = (fieldErrors, field) => fieldErrors?.[field]?.[0] || "";

export const buildDetailMessages = (normalizedError) => {
  if (!normalizedError?.details?.length) return [];

  return normalizedError.details.map((item) =>
    item.field ? `${humanizeField(item.field)}: ${item.message}` : item.message
  );
};
