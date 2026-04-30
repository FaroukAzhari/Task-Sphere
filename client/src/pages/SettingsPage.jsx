import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { updateProfileApi } from "../api/userApi";
import useAuth from "../hooks/useAuth";

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
const FOCUS_MODES = ["Builder", "Planner", "Reviewer", "Researcher"];

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read selected file"));
    reader.readAsDataURL(file);
  });

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    headline: user?.headline || "",
    location: user?.location || "",
    focusMode: user?.focusMode || "Builder",
    accentColor: user?.accentColor || "#0f8b8d",
    avatarUrl: user?.avatarUrl || "",
    notificationPreferences: {
      emailEnabled: user?.notificationPreferences?.emailEnabled ?? true,
      taskAssigned: user?.notificationPreferences?.taskAssigned ?? true,
      sprintUpdates: user?.notificationPreferences?.sprintUpdates ?? true,
      mentions: user?.notificationPreferences?.mentions ?? true,
      teamInvites: user?.notificationPreferences?.teamInvites ?? true,
    },
  });

  const initials = useMemo(() => {
    const value = (form.name || user?.name || "U").trim();
    return value.slice(0, 1).toUpperCase();
  }, [form.name, user?.name]);

  const mutation = useMutation({
    mutationFn: updateProfileApi,
    onSuccess: (payload) => {
      updateUser(payload);
      setForm((prev) => ({ ...prev, ...payload, avatarUrl: payload.avatarUrl || "" }));
    },
    onError: (apiError) => {
      setError(apiError?.response?.data?.message || "Could not update profile.");
    },
  });

  const handleAvatarFile = async (event) => {
    setError("");
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a .png or .jpeg/.jpg image file.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setError("Avatar must be 2MB or smaller.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
    } catch (_err) {
      setError("Failed to load image file.");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="card p-4">
        <h2 className="ds-text text-lg font-semibold">User settings</h2>
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-3">
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="Avatar preview" className="h-12 w-12 rounded-full border border-slate-300 object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-sm font-semibold text-slate-700">
                {initials}
              </div>
            )}
            <div className="flex-1">
              <label className="ds-muted mb-1 block text-xs font-semibold uppercase tracking-wide">Avatar image (.png / .jpeg)</label>
              <input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" onChange={handleAvatarFile} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>

          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Name"
          />

          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            value={form.headline}
            maxLength={80}
            onChange={(e) => setForm((prev) => ({ ...prev, headline: e.target.value }))}
            placeholder="Headline (e.g., Backend Engineer & Sprint Nerd)"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              value={form.location}
              maxLength={60}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Location"
            />
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              value={form.focusMode}
              onChange={(e) => setForm((prev) => ({ ...prev, focusMode: e.target.value }))}
            >
              {FOCUS_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  Focus: {mode}
                </option>
              ))}
            </select>
          </div>

          <textarea
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            value={form.bio}
            onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
            placeholder="Bio"
          />

          <div className="rounded-2xl border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Accent color</p>
              <span className="rounded-full border border-slate-300 px-2 py-0.5 font-mono text-xs">{form.accentColor}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={form.accentColor}
                onChange={(e) => setForm((prev) => ({ ...prev, accentColor: e.target.value }))}
                className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300 bg-transparent p-1"
              />
              <input
                value={form.accentColor}
                onChange={(e) => setForm((prev) => ({ ...prev, accentColor: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm"
                placeholder="#0f8b8d"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-3">
            <p className="text-sm font-semibold">Notification preferences</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                ["emailEnabled", "Email channel"],
                ["taskAssigned", "Task assignments"],
                ["sprintUpdates", "Sprint updates"],
                ["mentions", "Mentions"],
                ["teamInvites", "Team invites"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(form.notificationPreferences[key])}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        notificationPreferences: {
                          ...prev.notificationPreferences,
                          [key]: e.target.checked,
                        },
                      }))
                    }
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setError("");
            mutation.mutate(form);
          }}
          className="ds-btn-primary mt-3 rounded-xl px-4 py-2 text-sm font-semibold"
        >
          Save profile
        </button>
        {mutation.isSuccess && <p className="mt-2 text-sm text-emerald-600">Profile updated.</p>}
        {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
      </div>

      <div className="card p-4">
        <p className="ds-kicker text-xs font-semibold">Live preview</p>
        <div
          className="mt-3 rounded-2xl border border-slate-200 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(246,250,252,0.92))] p-4"
          style={{ boxShadow: `inset 0 0 0 1px ${form.accentColor}33` }}
        >
          <div className="flex items-center gap-3">
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="Preview avatar" className="h-14 w-14 rounded-full border-2 object-cover" style={{ borderColor: form.accentColor }} />
            ) : (
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full border-2 text-base font-bold text-slate-800"
                style={{ borderColor: form.accentColor, backgroundColor: `${form.accentColor}22` }}
              >
                {initials}
              </div>
            )}
            <div>
              <p className="text-base font-bold">{form.name || "Your Name"}</p>
              <p className="text-sm text-slate-600">{form.headline || "Add a short headline to personalize your profile."}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className="rounded-full border px-3 py-1 text-xs font-semibold"
              style={{ borderColor: `${form.accentColor}66`, backgroundColor: `${form.accentColor}14` }}
            >
              {form.focusMode}
            </span>
            {form.location ? (
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                {form.location}
              </span>
            ) : null}
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              {user?.globalRole || "Member"}
            </span>
          </div>
          <p className="mt-4 rounded-xl border border-slate-200 bg-white/70 p-3 text-sm text-slate-700">
            {form.bio || "Write a short bio about your workflow, interests, or role in the team."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
