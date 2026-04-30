const StatCard = ({ label, value, tone = "default" }) => {
  const color = {
    default: "text-slate-900",
    warn: "text-amber-600",
    danger: "text-rose-600",
    success: "text-emerald-600",
  }[tone];

  return (
    <div className="card p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
};

export default StatCard;
