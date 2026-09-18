export function Sparkline({
  values,
  color = "#6D28D9",
}: {
  values: number[];
  color?: string;
}) {
  const width = 120;
  const height = 36;
  if (!values.length) return <svg width={width} height={height} aria-hidden="true" />;
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values
    .map((value, index) => `${index * step},${height - (value / max) * (height - 4) - 2}`)
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="2.2" points={points} />
    </svg>
  );
}

export function BarChart({
  points,
  color = "#6D28D9",
  label,
}: {
  points: Array<{ label: string; value: number }>;
  color?: string;
  label: string;
}) {
  const max = Math.max(...points.map((point) => point.value), 1);
  return (
    <section className="admin-card p-4">
      <h2 className="text-sm font-semibold text-slate-600">{label}</h2>
      <div className="mt-4 flex h-40 items-end gap-1">
        {points.map((point) => (
          <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md"
              style={{
                height: `${Math.max(4, (point.value / max) * 100)}%`,
                background: color,
                opacity: 0.85,
              }}
              title={`${point.label}: ${point.value.toLocaleString("fr-FR")}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-slate-400">
        <span>{points[0]?.label ?? ""}</span>
        <span>{points.at(-1)?.label ?? ""}</span>
      </div>
    </section>
  );
}
