import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProjectDiscussionApi,
  createProjectDocumentApi,
  deleteProjectDocumentApi,
  fetchProjectDiscussionsApi,
  fetchProjectDocumentsApi,
  toggleProjectDiscussionPinApi,
  updateProjectDocumentApi,
} from "../../api/projectApi";
import Badge from "../common/Badge";

const ProjectHub = ({ projectId, canContribute, canModerate }) => {
  const queryClient = useQueryClient();
  const [discussionText, setDiscussionText] = useState("");
  const [documentForm, setDocumentForm] = useState({
    title: "",
    description: "",
    url: "",
    category: "General",
  });
  const [editingDocumentId, setEditingDocumentId] = useState("");

  const discussionsQuery = useQuery({
    queryKey: ["project-discussions", projectId],
    queryFn: () => fetchProjectDiscussionsApi(projectId),
    enabled: Boolean(projectId),
  });

  const documentsQuery = useQuery({
    queryKey: ["project-documents", projectId],
    queryFn: () => fetchProjectDocumentsApi(projectId),
    enabled: Boolean(projectId),
  });

  const discussionMutation = useMutation({
    mutationFn: createProjectDiscussionApi,
    onSuccess: async () => {
      setDiscussionText("");
      await queryClient.invalidateQueries({ queryKey: ["project-discussions", projectId] });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: toggleProjectDiscussionPinApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["project-discussions", projectId] });
    },
  });

  const documentMutation = useMutation({
    mutationFn: createProjectDocumentApi,
    onSuccess: async () => {
      setDocumentForm({ title: "", description: "", url: "", category: "General" });
      await queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: deleteProjectDocumentApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: updateProjectDocumentApi,
    onSuccess: async () => {
      setEditingDocumentId("");
      setDocumentForm({ title: "", description: "", url: "", category: "General" });
      await queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
    },
  });

  const discussions = discussionsQuery.data || [];
  const documents = documentsQuery.data || [];
  const pinnedDiscussions = discussions.filter((entry) => entry.isPinned);
  const latestDiscussions = discussions.filter((entry) => !entry.isPinned);
  const isEditingDocument = Boolean(editingDocumentId);

  const startEditingDocument = (document) => {
    setEditingDocumentId(document._id);
    setDocumentForm({
      title: document.title || "",
      description: document.description || "",
      url: document.url || "",
      category: document.category || "General",
    });
  };

  const resetDocumentForm = () => {
    setEditingDocumentId("");
    setDocumentForm({ title: "", description: "", url: "", category: "General" });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="ds-kicker text-[11px] font-semibold">Project Hub</p>
            <h3 className="ds-text mt-2 text-2xl font-black">Updates & discussions</h3>
          </div>
          <span className="settings-pill rounded-full px-3 py-1 text-xs font-semibold">
            {discussions.length} entries
          </span>
        </div>

        <div className="mt-4 space-y-4">
          <div className="hub-composer rounded-2xl p-4">
            <p className="ds-text text-sm font-semibold">Post an update</p>
            <textarea
              value={discussionText}
              onChange={(event) => setDiscussionText(event.target.value)}
              disabled={!canContribute}
              rows={4}
              className="mt-3 w-full rounded-2xl border border-slate-300 px-3 py-3"
              placeholder={canContribute ? "Share progress, blockers, or decisions with the project team." : "Viewers can read project updates only."}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="ds-muted text-xs">Pinned updates stay at the top for the whole team.</p>
              <button
                type="button"
                disabled={!canContribute || discussionText.trim().length < 2 || discussionMutation.isPending}
                className="ds-btn-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
                onClick={() => discussionMutation.mutate({ projectId, content: discussionText })}
              >
                Post update
              </button>
            </div>
          </div>

          {pinnedDiscussions.length > 0 ? (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <h4 className="ds-text text-sm font-bold uppercase tracking-[0.14em]">Pinned</h4>
                <Badge text={`${pinnedDiscussions.length}`} tone="medium" />
              </div>
              <div className="space-y-3">
                {pinnedDiscussions.map((entry) => (
                  <div key={entry._id} className="hub-entry hub-entry-pinned rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="ds-text text-sm font-semibold">{entry.author?.name || "User"}</p>
                        <p className="ds-muted mt-1 text-xs">
                          {new Date(entry.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge text="Pinned" tone="medium" />
                        {canModerate ? (
                          <button
                            type="button"
                            className="notification-action-btn rounded-lg px-3 py-2 text-xs font-semibold"
                            onClick={() => togglePinMutation.mutate({ projectId, entryId: entry._id })}
                          >
                            Unpin
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <p className="ds-text mt-3 text-sm leading-relaxed">{entry.content}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <h4 className="ds-text mb-3 text-sm font-bold uppercase tracking-[0.14em]">Latest updates</h4>
            <div className="space-y-3">
              {latestDiscussions.map((entry) => (
                <div key={entry._id} className="hub-entry rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="ds-text text-sm font-semibold">{entry.author?.name || "User"}</p>
                      <p className="ds-muted mt-1 text-xs">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {canModerate ? (
                      <button
                        type="button"
                        className="notification-action-btn rounded-lg px-3 py-2 text-xs font-semibold"
                        onClick={() => togglePinMutation.mutate({ projectId, entryId: entry._id })}
                      >
                        Pin
                      </button>
                    ) : null}
                  </div>
                  <p className="ds-text mt-3 text-sm leading-relaxed">{entry.content}</p>
                </div>
              ))}
              {discussions.length === 0 ? (
                <div className="hub-empty rounded-2xl p-4">
                  <p className="ds-text text-sm font-semibold">No project updates yet.</p>
                  <p className="ds-muted mt-1 text-sm">Use this space for decisions, progress notes, and shared context.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="ds-kicker text-[11px] font-semibold">Shared Resources</p>
            <h3 className="ds-text mt-2 text-2xl font-black">Documents</h3>
          </div>
          <span className="settings-pill rounded-full px-3 py-1 text-xs font-semibold">
            {documents.length} saved
          </span>
        </div>

        <div className="mt-4 space-y-4">
          <div className="hub-composer rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="ds-text text-sm font-semibold">{isEditingDocument ? "Edit document link" : "Save a document link"}</p>
              {isEditingDocument ? (
                <button type="button" className="notification-action-btn rounded-lg px-3 py-2 text-xs font-semibold" onClick={resetDocumentForm}>
                  Cancel
                </button>
              ) : null}
            </div>
            <div className="mt-3 grid gap-3">
              <input
                value={documentForm.title}
                onChange={(event) => setDocumentForm((prev) => ({ ...prev, title: event.target.value }))}
                disabled={!canContribute}
                className="rounded-2xl border border-slate-300 px-3 py-2"
                placeholder="Document title"
              />
              <input
                value={documentForm.url}
                onChange={(event) => setDocumentForm((prev) => ({ ...prev, url: event.target.value }))}
                disabled={!canContribute}
                className="rounded-2xl border border-slate-300 px-3 py-2"
                placeholder="https://..."
              />
              <div className="grid gap-3 md:grid-cols-[0.8fr_1.2fr]">
                <input
                  value={documentForm.category}
                  onChange={(event) => setDocumentForm((prev) => ({ ...prev, category: event.target.value }))}
                  disabled={!canContribute}
                  className="rounded-2xl border border-slate-300 px-3 py-2"
                  placeholder="Category"
                />
                <input
                  value={documentForm.description}
                  onChange={(event) => setDocumentForm((prev) => ({ ...prev, description: event.target.value }))}
                  disabled={!canContribute}
                  className="rounded-2xl border border-slate-300 px-3 py-2"
                  placeholder="Short description"
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="ds-muted text-xs">V1 stores metadata and links, not binary uploads.</p>
              <button
                type="button"
                disabled={
                  !canContribute ||
                  !documentForm.title.trim() ||
                  !documentForm.url.trim() ||
                  documentMutation.isPending ||
                  updateDocumentMutation.isPending
                }
                className="ds-btn-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
                onClick={() =>
                  isEditingDocument
                    ? updateDocumentMutation.mutate({ projectId, documentId: editingDocumentId, payload: documentForm })
                    : documentMutation.mutate({ projectId, payload: documentForm })
                }
              >
                {isEditingDocument ? "Update document" : "Save document"}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {documents.map((document) => (
              <div key={document._id} className="hub-entry rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="ds-text text-sm font-semibold">{document.title}</p>
                    <p className="ds-muted mt-1 text-xs">
                      {document.category || "General"} | saved by {document.uploadedBy?.name || "User"} on {new Date(document.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {canModerate ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="notification-action-btn rounded-lg px-3 py-2 text-xs font-semibold"
                        onClick={() => startEditingDocument(document)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="hub-danger-btn rounded-lg px-3 py-2 text-xs font-semibold"
                        onClick={() => deleteDocumentMutation.mutate({ projectId, documentId: document._id })}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
                {document.description ? <p className="ds-muted mt-3 text-sm">{document.description}</p> : null}
                <a
                  href={document.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex rounded-xl border border-teal-300 px-3 py-2 text-sm font-semibold text-teal-700"
                >
                  Open document
                </a>
              </div>
            ))}
            {documents.length === 0 ? (
              <div className="hub-empty rounded-2xl p-4">
                <p className="ds-text text-sm font-semibold">No saved documents yet.</p>
                <p className="ds-muted mt-1 text-sm">Store briefs, design links, repos, or testing references in one shared place.</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProjectHub;
