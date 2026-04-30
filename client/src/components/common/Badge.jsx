const Badge = ({ text, tone = "default" }) => {
  const toneClass = {
    default: "bg-slate-100 text-slate-700",
    low: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-rose-100 text-rose-700",
    info: "bg-teal-100 text-teal-700",
  }[tone];

  return <span className={`badge ${toneClass}`}>{text}</span>;
};

export default Badge;
