import { ImageResponse } from "next/og";
import { BITE_FOREST, BITE_ICON_PX } from "@/lib/biteMarkPixels";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — mono forest pixel open-mouth profile, transparent ground. */
export default function AppleIcon() {
  const scale = 180 / 16;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "transparent",
        }}
      >
        {BITE_ICON_PX.map(([x, y, w, h]) => (
          <div
            key={`${x}-${y}-${w}-${h}`}
            style={{
              position: "absolute",
              left: Math.round(x * scale),
              top: Math.round(y * scale),
              width: Math.round(w * scale),
              height: Math.round(h * scale),
              backgroundColor: BITE_FOREST,
            }}
          />
        ))}
      </div>
    ),
    { ...size },
  );
}
