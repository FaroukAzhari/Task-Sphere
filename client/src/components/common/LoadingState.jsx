const LoadingState = ({ label = "Loading..." }) => (
  <div className="card min-h-32 p-6">
    <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
    <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-slate-200" />
    <p className="mt-5 text-sm text-slate-500">{label}</p>
  </div>
);

export default LoadingState;
