"use client";

import {
  BITE_DOTS,
  BITE_EYE_BLINK,
  BITE_FOREST,
  BITE_JAW,
  BITE_MOUTH_A,
  BITE_MOUTH_B,
  BITE_MOUTH_C,
  BITE_STATIC,
  type BitePx,
} from "@/lib/biteMarkPixels";

/** Single brand fill — forest only (transparent elsewhere). */
const G = `var(--forest, ${BITE_FOREST})`;

function Px({
  x,
  y,
  w = 1,
  h = 1,
  fill = G,
  opacity,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  fill?: string;
  opacity?: number;
}) {
  return <rect x={x} y={y} width={w} height={h} fill={fill} opacity={opacity} />;
}

function Pixels({ cells, fill = G }: { cells: readonly BitePx[]; fill?: string }) {
  return (
    <>
      {cells.map(([x, y, w, h]) => (
        <Px key={`${x}-${y}-${w}-${h}`} x={x} y={y} w={w} h={h} fill={fill} />
      ))}
    </>
  );
}

/**
 * Bite brand mark — mono forest-green pixel profile, mouth as pie-wedge cutout.
 * Drawn on a coarse 16×16 grid (1 unit = one visible pixel). Transparent ground.
 */
export function BiteLogo({
  size = 40,
  animated = true,
  className = "",
  title = "Bite",
  showDots = true,
}: {
  size?: number;
  animated?: boolean;
  className?: string;
  title?: string;
  /** Optional food pellets trailing the bite (loading / lockup). */
  showDots?: boolean;
}) {
  const idle = animated ? "bite-logo-idle" : "";
  const vbW = showDots ? 28 : 16;
  const vbH = 16;
  const width = showDots ? size * 1.75 : size;

  return (
    <span
      className={`bite-logo inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width, height: size }}
      role="img"
      aria-label={title}
    >
      <svg
        className={`bite-logo-sprite ${idle}`}
        width={width}
        height={size}
        viewBox={`0 0 ${vbW} ${vbH}`}
        shapeRendering="crispEdges"
        style={{ imageRendering: "pixelated" }}
        fill="none"
        aria-hidden
      >
        <g className="bite-logo-head">
          <Pixels cells={BITE_STATIC} />

          <g className="bite-logo-blink" opacity={0}>
            <Pixels cells={BITE_EYE_BLINK} />
          </g>

          <g className="bite-logo-pie">
            <g className="bite-logo-mouth bite-logo-mouth--a">
              <Pixels cells={BITE_MOUTH_A} />
            </g>
            <g className="bite-logo-mouth bite-logo-mouth--b" opacity={0}>
              <Pixels cells={BITE_MOUTH_B} />
            </g>
            <g className="bite-logo-mouth bite-logo-mouth--c" opacity={0}>
              <Pixels cells={BITE_MOUTH_C} />
            </g>
          </g>

          <g className="bite-logo-jaw">
            <Pixels cells={BITE_JAW} />
          </g>
        </g>

        {showDots && (
          <g className="bite-logo-dots">
            {BITE_DOTS.map(([x, y, w, h], i) => (
              <rect
                key={`dot-${i}`}
                className={`bite-dot bite-dot--${i + 1}`}
                x={x}
                y={y}
                width={w}
                height={h}
                fill={G}
              />
            ))}
          </g>
        )}
      </svg>
    </span>
  );
}

/** Compact mark without food pellets. */
export function BiteMark({
  size = 28,
  animated = true,
  className = "",
}: {
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  return <BiteLogo size={size} animated={animated} showDots={false} className={className} />;
}

/**
 * Full-screen / panel loader — continuous chomp while meal AI runs.
 */
export function BiteLoader({
  size = 72,
  label = "Reading your plate…",
  className = "",
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <BiteLogo size={size} animated showDots className="bite-logo-loading" />
      {label ? (
        <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
      ) : null}
    </div>
  );
}

/** Logo + wordmark for headers / onboarding heroes. */
export function BrandLockup({
  size = 44,
  textClassName = "font-[family-name:var(--font-display)] text-3xl leading-none tracking-tight text-[var(--ink)]",
  animated = true,
  className = "",
  showDots = false,
}: {
  size?: number;
  textClassName?: string;
  animated?: boolean;
  className?: string;
  showDots?: boolean;
}) {
  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      <BiteLogo size={size} animated={animated} showDots={showDots} />
      <span className={`brand-pop ${textClassName}`}>Bite</span>
    </div>
  );
}
