const ErrorBanner = ({ summary, details = [] }) => {
  if (!summary) return null;

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
      <p className="text-sm font-semibold">{summary}</p>
      {details.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export default ErrorBanner;
