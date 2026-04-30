const EmptyState = ({ title, description }) => (
  <div className="card p-8 text-center">
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="mt-2 text-sm text-slate-500">{description}</p>
  </div>
);

export default EmptyState;
