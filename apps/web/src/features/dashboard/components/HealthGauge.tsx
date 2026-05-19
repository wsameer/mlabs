import { STAGES, type StageIndex } from "./health-stages";

interface HealthGaugeProps {
  savingsPct: number;
  stageIndex: StageIndex;
  disabled: boolean;
}

export function HealthGauge({
  savingsPct,
  stageIndex,
  disabled,
}: HealthGaugeProps) {
  const size = 400;
  const dimens = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = 190;
  const strokeWidth = 16;
  const gapDeg = 6;

  const arcStart = 150;
  const arcEnd = 300;
  const arcSweep = arcEnd - arcStart;

  const pctToAngle = (pct: number) =>
    arcStart + (Math.min(100, Math.max(0, pct)) / 100) * arcSweep;

  const segments = STAGES.map((s, i) => {
    const segStart = pctToAngle(s.startPct) + (i === 0 ? 0 : gapDeg / 2);
    const segEnd =
      pctToAngle(s.endPct) - (i === STAGES.length - 1 ? 0 : gapDeg / 2);
    return {
      ...s,
      d: arcPath(cx, cy, r, segStart, segEnd),
    };
  });

  const knob = polar(cx, cy, r, pctToAngle(savingsPct));

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={dimens}
      height={dimens}
      className="pointer-events-none absolute"
      style={{ right: -58, bottom: -58 }}
      role="img"
      aria-label={
        disabled
          ? "Financial health gauge — no data"
          : `Financial health: ${savingsPct}% saved`
      }
    >
      <circle cx={cx} cy={cy} r={r - strokeWidth} className="fill-muted/30" />

      {segments.map((seg, i) => (
        <path
          key={i}
          d={seg.d}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={disabled ? "stroke-muted" : seg.arcClassName}
        />
      ))}

      {!disabled && (
        <>
          <circle
            cx={knob.x}
            cy={knob.y}
            r={strokeWidth / 2 + 5}
            className="fill-background"
          />
          <circle
            cx={knob.x}
            cy={knob.y}
            r={strokeWidth / 2 + 1}
            className={STAGES[stageIndex].arcClassName.replace(
              "stroke-",
              "fill-"
            )}
          />
        </>
      )}
    </svg>
  );
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
) {
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}
