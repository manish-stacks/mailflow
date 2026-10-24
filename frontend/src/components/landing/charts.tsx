/** Tiny dependency-free SVG line/area chart used by mockups. Illustrative data only. */
export function MiniChart({ series, labels, height = 160 }: { series: { name: string; color: string; data: number[]; area?: boolean }[]; labels?: string[]; height?: number }) {
  const W = 560, H = height, P = { l: 8, r: 8, t: 10, b: labels ? 22 : 8 };
  const max = Math.max(...series.flatMap((s) => s.data)) * 1.1;
  const n = series[0].data.length;
  const x = (i: number) => P.l + (i * (W - P.l - P.r)) / (n - 1);
  const y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);
  const path = (d: number[]) => d.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" preserveAspectRatio="none" aria-hidden="true">
      {[0.25, 0.5, 0.75, 1].map((g) => <line key={g} x1={P.l} x2={W - P.r} y1={P.t + (1 - g) * (H - P.t - P.b)} y2={P.t + (1 - g) * (H - P.t - P.b)} stroke="#E5E7EB" strokeDasharray="3 4" />)}
      {series.map((s) => (
        <g key={s.name}>
          {s.area && <path d={`${path(s.data)} L${x(n - 1)},${H - P.b} L${x(0)},${H - P.b} Z`} fill={s.color} opacity="0.08" />}
          <path d={path(s.data)} fill="none" stroke={s.color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </g>
      ))}
      {labels?.map((l, i) => <text key={l} x={x(i)} y={H - 6} fontSize="10" fill="#6B7280" textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>{l}</text>)}
    </svg>
  );
}
