import { useState } from "react";

const AuthForm = ({ mode = "login", onSubmit, loading }) => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const submit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {mode === "register" && (
        <input
          className="w-full rounded-xl border border-slate-300 px-3 py-2"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />
      )}
      <input
        className="w-full rounded-xl border border-slate-300 px-3 py-2"
        placeholder="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
      />
      <input
        className="w-full rounded-xl border border-slate-300 px-3 py-2"
        placeholder="Password"
        type="password"
        value={form.password}
        onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
      />
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
