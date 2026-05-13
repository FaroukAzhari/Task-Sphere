import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { chatWithFonAiApi } from "../../api/aiApi";
import { normalizeApiError } from "../../utils/apiError";

const STORAGE_KEY = "task_sphere_fon_ai_chat";

const quickPrompts = [
  "What does workload score mean?",
  "Why can't I add this user to a project?",
  "Who can run sprints?",
  "What is a pending invite?",
];

const initialMessages = [
  {
    role: "assistant",
    content:
      "I’m FON AI. Ask me about Task Sphere roles, invitations, tasks, sprints, analytics, and platform behavior.",
  },
];

const FonAiChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return initialMessages;
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialMessages;
    } catch {
      return initialMessages;
    }
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-12)));
  }, [messages]);

  const conversationHistory = useMemo(
    () =>
      messages
        .filter((entry) => entry.role === "user" || entry.role === "assistant")
        .slice(-8),
    [messages]
  );

  const chatMutation = useMutation({
    mutationFn: chatWithFonAiApi,
    onSuccess: (data) => {
      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
    },
    onError: (error) => {
      const parsed = normalizeApiError(error, "FON AI is unavailable right now.");
      const message = parsed.summary;
      setMessages((current) => [...current, { role: "assistant", content: message }]);
    },
  });

  const sendMessage = (nextMessage) => {
    const content = nextMessage.trim();
    if (!content || chatMutation.isPending) return;

    const nextHistory = [...conversationHistory, { role: "user", content }];
    setMessages((current) => [...current, { role: "user", content }]);
    setDraft("");
    chatMutation.mutate({ message: content, history: nextHistory.slice(-8) });
  };

  const clearChat = () => {
    setMessages(initialMessages);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      <motion.button
        type="button"
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="fon-ai-launcher"
      >
        <span className="fon-ai-launcher-badge">FON AI</span>
        <span className="fon-ai-launcher-copy">Platform help</span>
      </motion.button>

      <AnimatePresence>
        {isOpen ? (
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fon-ai-panel"
          >
            <div className="fon-ai-panel-top">
              <div>
                <p className="ds-kicker text-[10px] font-bold">Task Sphere Assistant</p>
                <h3 className="mt-1 text-lg font-bold ds-text">FON AI</h3>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="fon-ai-top-btn" onClick={clearChat}>
                  Clear
                </button>
                <button type="button" className="fon-ai-top-btn" onClick={() => setIsOpen(false)}>
                  Close
                </button>
              </div>
            </div>

            <div className="fon-ai-prompt-row">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="fon-ai-chip"
                  onClick={() => sendMessage(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="fon-ai-messages">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`fon-ai-message ${message.role === "user" ? "fon-ai-message-user" : "fon-ai-message-assistant"}`}
                >
                  <p className="fon-ai-message-role">{message.role === "user" ? "You" : "FON AI"}</p>
                  <p className="fon-ai-message-body">{message.content}</p>
                </div>
              ))}
              {chatMutation.isPending ? (
                <div className="fon-ai-message fon-ai-message-assistant">
                  <p className="fon-ai-message-role">FON AI</p>
                  <p className="fon-ai-message-body">Thinking through the platform logic...</p>
                </div>
              ) : null}
            </div>

            <form
              className="fon-ai-compose"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage(draft);
              }}
            >
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about roles, task rules, invites, sprints, or platform behavior"
                className="fon-ai-textarea"
                rows={3}
                maxLength={1200}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] ds-muted">Read-only help assistant. FON AI does not perform actions.</p>
                <button
                  type="submit"
                  className="ds-btn-primary rounded-xl px-4 py-2 text-sm font-semibold"
                  disabled={chatMutation.isPending || draft.trim().length < 2}
                >
                  Send
                </button>
              </div>
            </form>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default FonAiChat;
