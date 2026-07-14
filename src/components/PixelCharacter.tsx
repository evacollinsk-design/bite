"use client";

import type { AgeBand, Personality } from "@/lib/pixelCharacter";
import {
  PERSONALITY_ACCENTS,
  ageBandForAge,
  hairForAge,
  resolvePersonality,
  skinForName,
} from "@/lib/pixelCharacter";
import type { FamilyMember } from "@/lib/types";

type PixelMember = Pick<
  FamilyMember,
  "name" | "age" | "role" | "avatarColor" | "personality"
>;

export function PixelCharacter({
  member,
  size = 40,
  className = "",
  animated = true,
}: {
  member: PixelMember;
  size?: number;
  className?: string;
  animated?: boolean;
}) {
  const band = ageBandForAge(member.age);
  const personality = resolvePersonality(member);
  const accent = PERSONALITY_ACCENTS[personality];
  const skin = skinForName(member.name);
  const hair = hairForAge(band, accent);
  const clothes = member.avatarColor || "#0d9f6e";
  const idleClass = animated ? `pixel-idle pixel-idle--${personality}` : "";

  return (
    <span
      className={`pixel-avatar inline-flex shrink-0 items-end justify-center overflow-hidden rounded-2xl ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(160deg, color-mix(in srgb, ${clothes} 22%, white), color-mix(in srgb, ${accent} 18%, #fff9e8))`,
      }}
      aria-hidden
    >
      <svg
        className={`pixel-sprite ${idleClass}`}
        width={size * 0.92}
        height={size * 0.92}
        viewBox="0 0 32 32"
        shapeRendering="crispEdges"
        style={{ imageRendering: "pixelated" }}
      >
        {/* soft ground shadow */}
        <ellipse cx="16" cy="30" rx={band === "toddler" ? 6 : 7} ry="1.4" fill="rgba(26,47,40,0.12)" />

        <CharacterBody
          band={band}
          personality={personality}
          skin={skin}
          hair={hair}
          clothes={clothes}
          accent={accent}
        />
      </svg>
    </span>
  );
}

function CharacterBody({
  band,
  personality,
  skin,
  hair,
  clothes,
  accent,
}: {
  band: AgeBand;
  personality: Personality;
  skin: string;
  hair: string;
  clothes: string;
  accent: string;
}) {
  const layout = layoutForBand(band);
  const { headY, headSize, bodyY, bodyH, legY, armSpread, footY } = layout;

  const mouth = mouthForPersonality(personality);
  const eyeOpen = personality === "calm" ? 1.2 : 1.6;
  const browLift = personality === "cheeky" || personality === "energetic";
  const armUp = personality === "energetic" || personality === "playful";

  return (
    <g>
      {/* legs */}
      <rect x={13} y={legY} width={2} height={footY - legY} fill={clothes} />
      <rect x={17} y={legY} width={2} height={footY - legY} fill={clothes} />
      <rect x={12} y={footY} width={3} height={2} fill="#2a211c" />
      <rect x={17} y={footY} width={3} height={2} fill="#2a211c" />

      {/* torso */}
      <rect x={12} y={bodyY} width={8} height={bodyH} fill={clothes} />
      {band === "toddler" || band === "child" ? (
        <rect x={13} y={bodyY + 1} width={6} height={2} fill={accent} opacity={0.85} />
      ) : null}
      {band === "elderly" ? (
        <rect x={14} y={bodyY + 2} width={4} height={1} fill="#fff9e8" opacity={0.7} />
      ) : null}

      {/* arms */}
      {armUp ? (
        <>
          <rect x={10 - armSpread} y={bodyY - 1} width={2} height={5} fill={skin} />
          <rect x={20 + armSpread} y={bodyY - 2} width={2} height={5} fill={skin} />
          <rect x={9 - armSpread} y={bodyY - 2} width={2} height={2} fill={accent} />
          <rect x={21 + armSpread} y={bodyY - 3} width={2} height={2} fill={accent} />
        </>
      ) : (
        <>
          <rect x={10} y={bodyY + 1} width={2} height={6} fill={skin} />
          <rect x={20} y={bodyY + 1} width={2} height={6} fill={skin} />
        </>
      )}

      {/* head */}
      <rect x={16 - headSize / 2} y={headY} width={headSize} height={headSize} fill={skin} />

      {/* hair by age */}
      <Hair band={band} hair={hair} headY={headY} headSize={headSize} accent={accent} />

      {/* brows */}
      {browLift ? (
        <>
          <rect x={12} y={headY + 3} width={3} height={1} fill="#2a211c" />
          <rect x={17} y={headY + 2} width={3} height={1} fill="#2a211c" />
        </>
      ) : personality === "wise" ? (
        <>
          <rect x={12} y={headY + 3} width={3} height={1} fill="#5a7066" />
          <rect x={17} y={headY + 3} width={3} height={1} fill="#5a7066" />
        </>
      ) : null}

      {/* eyes + blink layer */}
      <g className="pixel-eyes">
        <rect x={12} y={headY + 5} width={2} height={eyeOpen} fill="#1a2f28" />
        {personality === "playful" || personality === "cheeky" ? (
          <rect x={18} y={headY + 5} width={2} height={1} fill="#1a2f28" />
        ) : (
          <rect x={18} y={headY + 5} width={2} height={eyeOpen} fill="#1a2f28" />
        )}
        {personality === "energetic" ? (
          <>
            <rect x={12} y={headY + 5} width={1} height={1} fill={accent} />
            <rect x={18} y={headY + 5} width={1} height={1} fill={accent} />
          </>
        ) : null}
      </g>
      <g className="pixel-blink" opacity={0}>
        <rect x={12} y={headY + 5} width={2} height={1} fill={skin} />
        <rect x={18} y={headY + 5} width={2} height={1} fill={skin} />
        <rect x={12} y={headY + 5.5} width={2} height={1} fill="#1a2f28" />
        <rect x={18} y={headY + 5.5} width={2} height={1} fill="#1a2f28" />
      </g>

      {/* cheeks for playful/toddler */}
      {(personality === "playful" || band === "toddler") && (
        <>
          <rect x={11} y={headY + 7} width={2} height={1} fill="#ff8fab" opacity={0.7} />
          <rect x={19} y={headY + 7} width={2} height={1} fill="#ff8fab" opacity={0.7} />
        </>
      )}

      {/* mouth */}
      <rect x={mouth.x} y={headY + mouth.y} width={mouth.w} height={mouth.h} fill="#c45c4a" />

      {/* accessories */}
      <Accessory
        personality={personality}
        band={band}
        accent={accent}
        headY={headY}
        headSize={headSize}
      />
    </g>
  );
}

function Hair({
  band,
  hair,
  headY,
  headSize,
  accent,
}: {
  band: AgeBand;
  hair: string;
  headY: number;
  headSize: number;
  accent: string;
}) {
  const left = 16 - headSize / 2;
  if (band === "toddler") {
    return (
      <>
        <rect x={left} y={headY - 1} width={headSize} height={3} fill={hair} />
        <rect x={left + 1} y={headY - 2} width={2} height={2} fill={hair} />
        <rect x={left + headSize - 3} y={headY - 2} width={2} height={2} fill={hair} />
      </>
    );
  }
  if (band === "child") {
    return (
      <>
        <rect x={left} y={headY - 1} width={headSize} height={3} fill={hair} />
        <rect x={left - 1} y={headY + 1} width={2} height={4} fill={hair} />
        <rect x={left + headSize - 1} y={headY + 1} width={2} height={4} fill={hair} />
      </>
    );
  }
  if (band === "teen") {
    return (
      <>
        <rect x={left} y={headY - 2} width={headSize} height={4} fill={hair} />
        <rect x={left - 1} y={headY} width={2} height={6} fill={hair} />
        <rect x={left + 2} y={headY - 3} width={2} height={2} fill={accent} opacity={0.9} />
      </>
    );
  }
  if (band === "elderly") {
    return (
      <>
        <rect x={left + 1} y={headY - 1} width={headSize - 2} height={3} fill={hair} />
        <rect x={left} y={headY + 2} width={2} height={3} fill={hair} />
        <rect x={left + headSize - 2} y={headY + 2} width={2} height={3} fill={hair} />
      </>
    );
  }
  // adult
  return (
    <>
      <rect x={left} y={headY - 1} width={headSize} height={3} fill={hair} />
      <rect x={left - 1} y={headY + 1} width={2} height={5} fill={hair} />
      <rect x={left + headSize - 1} y={headY + 1} width={2} height={4} fill={hair} />
    </>
  );
}

function Accessory({
  personality,
  band,
  accent,
  headY,
  headSize,
}: {
  personality: Personality;
  band: AgeBand;
  accent: string;
  headY: number;
  headSize: number;
}) {
  const left = 16 - headSize / 2;

  if (personality === "wise") {
    return (
      <g>
        {/* pixel glasses frames */}
        <rect x={11} y={headY + 4} width={4} height={1} fill="#1a2f28" />
        <rect x={11} y={headY + 6} width={4} height={1} fill="#1a2f28" />
        <rect x={11} y={headY + 5} width={1} height={1} fill="#1a2f28" />
        <rect x={14} y={headY + 5} width={1} height={1} fill="#1a2f28" />
        <rect x={17} y={headY + 4} width={4} height={1} fill="#1a2f28" />
        <rect x={17} y={headY + 6} width={4} height={1} fill="#1a2f28" />
        <rect x={17} y={headY + 5} width={1} height={1} fill="#1a2f28" />
        <rect x={20} y={headY + 5} width={1} height={1} fill="#1a2f28" />
        <rect x={15} y={headY + 5} width={2} height={1} fill="#1a2f28" />
        {band === "elderly" ? (
          <rect x={left + 1} y={headY - 2} width={headSize - 2} height={2} fill={accent} />
        ) : null}
      </g>
    );
  }

  if (personality === "playful") {
    return (
      <g>
        {/* berry bow */}
        <rect x={14} y={headY - 3} width={4} height={2} fill={accent} />
        <rect x={12} y={headY - 2} width={2} height={2} fill={accent} />
        <rect x={18} y={headY - 2} width={2} height={2} fill={accent} />
      </g>
    );
  }

  if (personality === "energetic") {
    return (
      <g>
        {/* citrus cap */}
        <rect x={left} y={headY - 2} width={headSize} height={2} fill={accent} />
        <rect x={left + 1} y={headY - 4} width={headSize - 2} height={2} fill={accent} />
        <rect x={15} y={headY - 5} width={2} height={2} fill="#ff5c3a" />
      </g>
    );
  }

  if (personality === "cheeky") {
    return (
      <g>
        {/* tilted citrus sprout */}
        <rect x={19} y={headY - 3} width={2} height={3} fill={accent} />
        <rect x={18} y={headY - 4} width={2} height={2} fill="#b8f23d" />
      </g>
    );
  }

  // calm — soft leaf pin
  return (
    <g>
      <rect x={20} y={headY + 8} width={2} height={2} fill={accent} />
      <rect x={21} y={headY + 7} width={2} height={1} fill="#b8f23d" />
    </g>
  );
}

function layoutForBand(band: AgeBand) {
  switch (band) {
    case "toddler":
      return { headY: 8, headSize: 12, bodyY: 18, bodyH: 5, legY: 23, armSpread: 0, footY: 27 };
    case "child":
      return { headY: 6, headSize: 12, bodyY: 16, bodyH: 6, legY: 22, armSpread: 0, footY: 27 };
    case "teen":
      return { headY: 4, headSize: 10, bodyY: 13, bodyH: 8, legY: 21, armSpread: 1, footY: 27 };
    case "elderly":
      return { headY: 5, headSize: 10, bodyY: 14, bodyH: 7, legY: 21, armSpread: 0, footY: 27 };
    default:
      return { headY: 4, headSize: 10, bodyY: 13, bodyH: 8, legY: 21, armSpread: 0, footY: 27 };
  }
}

function mouthForPersonality(personality: Personality) {
  switch (personality) {
    case "energetic":
      return { x: 14, y: 9, w: 4, h: 2 };
    case "calm":
      return { x: 14, y: 9, w: 4, h: 1 };
    case "playful":
      return { x: 13, y: 9, w: 5, h: 2 };
    case "wise":
      return { x: 14, y: 9, w: 4, h: 1 };
    case "cheeky":
      return { x: 15, y: 9, w: 3, h: 1 };
  }
}
