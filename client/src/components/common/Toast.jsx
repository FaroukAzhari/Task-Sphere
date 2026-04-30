const Toast = ({ message, type = "info", onClose }) => {
  if (!message) return null;

  const tone = {
    info: "bg-slate-900 text-white",
    success: "bg-emerald-600 text-white",
    error: "bg-rose-600 text-white",
  }[type];

  return (
    <div className={`pointer-events-auto fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg backdrop-blur-sm animate-toast-in ${tone}`}>
      <span className="text-sm font-medium">{message}</span>
      <button type="button" onClick={onClose} className="rounded-md bg-white/20 px-2 py-1 text-xs font-semibold hover:bg-white/30">
        Close
      </button>
    </div>
  );
};

export default Toast;
