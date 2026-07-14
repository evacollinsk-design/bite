import { ImageResponse } from "next/og";
import { BITE_FOREST, BITE_ICON_PX } from "@/lib/biteMarkPixels";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Favicon — mono forest pixel open-mouth profile, transparent ground. */
export default function Icon() {
  const scale = 2; // 16 logical → 32px

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
              left: x * scale,
              top: y * scale,
              width: w * scale,
              height: h * scale,
              backgroundColor: BITE_FOREST,
            }}
          />
        ))}
      </div>
    ),
    { ...size },
  );
}
