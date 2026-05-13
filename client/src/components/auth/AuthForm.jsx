import ErrorBanner from "../common/ErrorBanner";

const inputClassName = (hasError) =>
  `w-full rounded-xl border px-3 py-2 ${hasError ? "border-rose-400 bg-rose-50/40" : "border-slate-300"}`;

const AuthForm = ({ mode = "login", onSubmit, loading, errorSummary = "", errorDetails = [], fieldErrors = {} }) => {
  const submit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmit({
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <ErrorBanner summary={errorSummary} details={errorDetails} />

      {mode === "register" && (
        <div>
          <input
            className={inputClassName(Boolean(fieldErrors.name))}
            placeholder="Full name"
            name="name"
            aria-invalid={Boolean(fieldErrors.name)}
          />
          {fieldErrors.name ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.name}</p> : null}
        </div>
      )}

      <div>
        <input
          className={inputClassName(Boolean(fieldErrors.email))}
          placeholder="Email"
          type="email"
          name="email"
          aria-invalid={Boolean(fieldErrors.email)}
        />
        {fieldErrors.email ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p> : null}
      </div>

      <div>
        <input
          className={inputClassName(Boolean(fieldErrors.password))}
          placeholder="Password"
          type="password"
          name="password"
          aria-invalid={Boolean(fieldErrors.password)}
        />
        {mode === "register" ? (
          <p className="mt-1 text-xs text-slate-500">Password must be at least 6 characters long.</p>
        ) : null}
        {fieldErrors.password ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.password}</p> : null}
      </div>

      <button
        disabled={loading}
        className="w-full rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        type="submit"
      >
        {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
      </button>
    </form>
  );
};

export default AuthForm;
