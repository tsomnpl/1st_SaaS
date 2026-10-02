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

const CHART_HEIGHT = 144;

export function barHeight(value: number, max: number) {
  if (max <= 0 || value <= 0) return 3;
  return Math.max(8, Math.round((value / max) * CHART_HEIGHT));
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
  const max = Math.max(...points.map((point) => point.value), 0);
  return (
    <section className="admin-card p-4">
      <h2 className="text-sm font-semibold text-slate-600">{label}</h2>
      <div className="mt-4 flex h-36 items-end gap-px border-b border-slate-200">
        {points.map((point) => (
          <div key={point.label} className="flex h-full min-w-0 flex-1 items-end">
            <div
              className="w-full rounded-t-sm"
              style={{
                height: barHeight(point.value, max),
                background: color,
                opacity: point.value > 0 ? 0.92 : 0.45,
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
