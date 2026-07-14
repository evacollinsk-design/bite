/**
 * Bite mark geometry — mono forest-green pixel profile on transparent ground.
 * Mouth is a pie-wedge cutout; eye is a hole. Units are 16×16 grid cells.
 */

export const BITE_FOREST = "#0d9f6e";

export type BitePx = readonly [x: number, y: number, w: number, h: number];

/**
 * Hair, ear, face mass, forward brow tip, neck — shared across mouth frames.
 * Eye hole at (7,5)–(8,6) is left empty on purpose.
 */
export const BITE_STATIC: readonly BitePx[] = [
  [8, 1, 2, 1],
  [4, 2, 6, 1],
  [3, 3, 8, 1],
  [2, 4, 9, 1],
  [2, 5, 5, 1],
  [9, 5, 1, 1],
  [1, 6, 6, 1],
  [1, 7, 7, 1],
  [1, 8, 6, 1],
  [3, 9, 5, 1],
  [5, 13, 4, 1],
  [6, 14, 2, 1],
];

/** Lower jaw / chin — CSS-rotated for chomp. */
export const BITE_JAW: readonly BitePx[] = [
  [3, 10, 5, 1],
  [4, 11, 5, 1],
  [5, 12, 4, 1],
];

/** Frame A — wide-open ~90° pie wedge (transparent cavity to the right). */
export const BITE_MOUTH_A: readonly BitePx[] = [
  [10, 5, 2, 1],
  [8, 10, 1, 1],
  [9, 11, 2, 1],
];

/**
 * Frame B — taller bite / larger cavity.
 * Empty on purpose: inherits static + jaw only (mouth rim tips removed).
 */
export const BITE_MOUTH_B: readonly BitePx[] = [];

/** Frame C — almost closed. */
export const BITE_MOUTH_C: readonly BitePx[] = [
  [10, 5, 2, 1],
  [9, 6, 3, 1],
  [8, 7, 1, 1],
  [11, 7, 1, 1],
  [8, 10, 1, 1],
  [9, 11, 2, 1],
];

/** Eye hole — filled briefly on blink (same green). */
export const BITE_EYE_BLINK: readonly BitePx[] = [[7, 5, 2, 2]];

/** Food pellets trailing the bite (loaders). */
export const BITE_DOTS: readonly BitePx[] = [
  [18, 7, 2, 2],
  [22, 7, 2, 2],
  [26, 7, 2, 2],
];

/** Favicon / apple-icon: static open-mouth silhouette (frame A). */
export const BITE_ICON_PX: readonly BitePx[] = [
  ...BITE_STATIC,
  ...BITE_JAW,
  ...BITE_MOUTH_A,
];
