const Toast = ({ message, details = [], type = "info", onClose }) => {
  if (!message) return null;

  const tone = {
    info: "bg-slate-900 text-white",
    success: "bg-emerald-600 text-white",
    error: "bg-rose-600 text-white",
  }[type];

  return (
    <div className={`pointer-events-auto fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg backdrop-blur-sm animate-toast-in ${tone}`}>
      <div className="max-w-sm">
        <p className="text-sm font-medium">{message}</p>
        {details.length > 0 ? (
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-white/90">
            {details.slice(0, 3).map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <button type="button" onClick={onClose} className="rounded-md bg-white/20 px-2 py-1 text-xs font-semibold hover:bg-white/30">
        Close
      </button>
    </div>
  );
};

export default Toast;
