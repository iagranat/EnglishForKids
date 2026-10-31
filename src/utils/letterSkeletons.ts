export interface Point {
  x: number;
  y: number;
  color?: string;
}

export interface TracingEvaluationResult {
  status: 'empty' | 'incomplete' | 'good' | 'excellent';
  starsAwarded: number;
  scorePercent: number;
  isLeftToRight: boolean;
  coveragePercent: number;
  accuracyPercent: number;
  titleEn: string;
  titleHe: string;
  messageEn: string;
  messageHe: string;
}

type LetterPath = [number, number][];

const UPPERCASE_SKELETONS: Record<string, LetterPath[]> = {
  A: [
    [[-0.6, 0.95], [-0.3, 0.0], [0, -0.95], [0.3, 0.0], [0.6, 0.95]],
    [[-0.35, 0.2], [0, 0.2], [0.35, 0.2]],
  ],
  B: [
    [[-0.6, -0.95], [-0.6, -0.5], [-0.6, 0], [-0.6, 0.5], [-0.6, 0.95]],
    [[-0.6, -0.95], [0.1, -0.95], [0.55, -0.75], [0.55, -0.25], [0.1, 0], [-0.6, 0]],
    [[-0.6, 0], [0.15, 0], [0.65, 0.25], [0.65, 0.75], [0.15, 0.95], [-0.6, 0.95]],
  ],
  C: [
    [[0.6, -0.7], [0.2, -0.95], [-0.4, -0.8], [-0.7, -0.4], [-0.7, 0.4], [-0.4, 0.8], [0.2, 0.95], [0.6, 0.7]],
  ],
  D: [
    [[-0.6, -0.95], [-0.6, 0], [-0.6, 0.95]],
    [[-0.6, -0.95], [0.1, -0.95], [0.65, -0.5], [0.65, 0], [0.65, 0.5], [0.1, 0.95], [-0.6, 0.95]],
  ],
  E: [
    [[-0.6, -0.95], [-0.6, 0], [-0.6, 0.95]],
    [[-0.6, -0.95], [0.6, -0.95]],
    [[-0.6, 0], [0.4, 0]],
    [[-0.6, 0.95], [0.6, 0.95]],
  ],
  F: [
    [[-0.6, -0.95], [-0.6, 0], [-0.6, 0.95]],
    [[-0.6, -0.95], [0.6, -0.95]],
    [[-0.6, 0], [0.4, 0]],
  ],
  G: [
    [[0.6, -0.7], [0.2, -0.95], [-0.5, -0.8], [-0.7, 0], [-0.5, 0.8], [0.2, 0.95], [0.6, 0.7], [0.6, 0.1], [0.1, 0.1]],
  ],
  H: [
    [[-0.6, -0.95], [-0.6, 0], [-0.6, 0.95]],
    [[0.6, -0.95], [0.6, 0], [0.6, 0.95]],
    [[-0.6, 0], [0.6, 0]],
  ],
  I: [
    [[0, -0.95], [0, 0], [0, 0.95]],
    [[-0.5, -0.95], [0.5, -0.95]],
    [[-0.5, 0.95], [0.5, 0.95]],
  ],
  J: [
    [[-0.4, -0.95], [0.3, -0.95]],
    [[0.3, -0.95], [0.3, 0.4], [0.1, 0.9], [-0.3, 0.9], [-0.6, 0.6]],
  ],
  K: [
    [[-0.6, -0.95], [-0.6, 0], [-0.6, 0.95]],
    [[0.6, -0.95], [0, -0.4], [-0.6, 0.0]],
    [[-0.2, -0.15], [0.6, 0.95]],
  ],
  L: [
    [[-0.6, -0.95], [-0.6, 0], [-0.6, 0.95]],
    [[-0.6, 0.95], [0.6, 0.95]],
  ],
  M: [
    [[-0.7, 0.95], [-0.7, -0.95], [-0.35, -0.2], [0, 0.3], [0.35, -0.2], [0.7, -0.95], [0.7, 0.95]],
  ],
  N: [
    [[-0.6, 0.95], [-0.6, -0.95], [0, 0], [0.6, 0.95], [0.6, -0.95]],
  ],
  O: [
    [[0, -0.95], [0.55, -0.65], [0.7, 0], [0.55, 0.65], [0, 0.95], [-0.55, 0.65], [-0.7, 0], [-0.55, -0.65], [0, -0.95]],
  ],
  P: [
    [[-0.6, -0.95], [-0.6, 0], [-0.6, 0.95]],
    [[-0.6, -0.95], [0.1, -0.95], [0.6, -0.75], [0.6, -0.25], [0.1, 0], [-0.6, 0]],
  ],
  Q: [
    [[0, -0.95], [0.55, -0.65], [0.7, 0], [0.55, 0.65], [0, 0.95], [-0.55, 0.65], [-0.7, 0], [-0.55, -0.65], [0, -0.95]],
    [[0.1, 0.3], [0.4, 0.65], [0.7, 0.95]],
  ],
  R: [
    [[-0.6, -0.95], [-0.6, 0], [-0.6, 0.95]],
    [[-0.6, -0.95], [0.1, -0.95], [0.6, -0.75], [0.6, -0.25], [0.1, 0], [-0.6, 0]],
    [[-0.1, 0], [0.25, 0.5], [0.6, 0.95]],
  ],
  S: [
    [[0.55, -0.7], [0.1, -0.95], [-0.5, -0.75], [-0.5, -0.3], [0, 0], [0.55, 0.3], [0.55, 0.75], [0.1, 0.95], [-0.55, 0.7]],
  ],
  T: [
    [[-0.7, -0.95], [0, -0.95], [0.7, -0.95]],
    [[0, -0.95], [0, 0], [0, 0.95]],
  ],
  U: [
    [[-0.6, -0.95], [-0.6, 0.3], [-0.4, 0.8], [0, 0.95], [0.4, 0.8], [0.6, 0.3], [0.6, -0.95]],
  ],
  V: [
    [[-0.7, -0.95], [-0.35, 0], [0, 0.95], [0.35, 0], [0.7, -0.95]],
  ],
  W: [
    [[-0.8, -0.95], [-0.5, 0.95], [-0.2, 0], [0, -0.2], [0.2, 0], [0.5, 0.95], [0.8, -0.95]],
  ],
  X: [
    [[-0.7, -0.95], [0, 0], [0.7, 0.95]],
    [[0.7, -0.95], [0, 0], [-0.7, 0.95]],
  ],
  Y: [
    [[-0.7, -0.95], [-0.35, -0.5], [0, 0]],
    [[0.7, -0.95], [0.35, -0.5], [0, 0]],
    [[0, 0], [0, 0.5], [0, 0.95]],
  ],
  Z: [
    [[-0.6, -0.95], [0.6, -0.95], [0, 0], [-0.6, 0.95], [0.6, 0.95]],
  ],
};

const LOWERCASE_SKELETONS: Record<string, LetterPath[]> = {
  a: [
    [[0.35, -0.35], [0, -0.4], [-0.45, -0.1], [-0.5, 0.35], [-0.2, 0.8], [0.35, 0.8]],
    [[0.35, -0.4], [0.35, 0.4], [0.35, 0.95]],
  ],
  b: [
    [[-0.5, -0.95], [-0.5, 0], [-0.5, 0.95]],
    [[-0.5, -0.2], [0.1, -0.25], [0.55, 0.15], [0.55, 0.6], [0.1, 0.95], [-0.5, 0.95]],
  ],
  c: [
    [[0.45, -0.15], [0.1, -0.35], [-0.5, -0.1], [-0.5, 0.5], [0.1, 0.9], [0.45, 0.7]],
  ],
  d: [
    [[0.5, -0.95], [0.5, 0], [0.5, 0.95]],
    [[0.5, -0.2], [-0.1, -0.25], [-0.55, 0.15], [-0.55, 0.6], [-0.1, 0.95], [0.5, 0.95]],
  ],
  e: [
    [[-0.5, 0.25], [0.5, 0.25], [0.5, 0], [0.1, -0.35], [-0.5, 0], [-0.5, 0.6], [0.1, 0.9], [0.45, 0.75]],
  ],
  f: [
    [[0.4, -0.85], [0.1, -0.95], [-0.2, -0.75], [-0.2, 0.95]],
    [[-0.5, -0.2], [0.3, -0.2]],
  ],
  g: [
    [[0.35, -0.3], [-0.2, -0.35], [-0.5, 0.1], [-0.2, 0.55], [0.35, 0.55]],
    [[0.35, -0.35], [0.35, 0.9], [0.1, 1.3], [-0.4, 1.25]],
  ],
  h: [
    [[-0.5, -0.95], [-0.5, 0], [-0.5, 0.95]],
    [[-0.5, 0], [0, -0.25], [0.45, 0.1], [0.45, 0.95]],
  ],
  i: [
    [[0, -0.25], [0, 0.4], [0, 0.95]],
    [[0, -0.75]],
  ],
  j: [
    [[0.2, -0.25], [0.2, 0.9], [0, 1.3], [-0.4, 1.2]],
    [[0.2, -0.75]],
  ],
  k: [
    [[-0.5, -0.95], [-0.5, 0], [-0.5, 0.95]],
    [[0.45, -0.25], [-0.1, 0.2], [-0.5, 0.3]],
    [[-0.15, 0.15], [0.45, 0.95]],
  ],
  l: [
    [[0, -0.95], [0, 0], [0, 0.85], [0.25, 0.95]],
  ],
  m: [
    [[-0.7, -0.25], [-0.7, 0.95]],
    [[-0.7, 0.05], [-0.35, -0.3], [0, 0.05], [0, 0.95]],
    [[0, 0.05], [0.35, -0.3], [0.7, 0.05], [0.7, 0.95]],
  ],
  n: [
    [[-0.5, -0.25], [-0.5, 0.95]],
    [[-0.5, 0.05], [0, -0.3], [0.5, 0.05], [0.5, 0.95]],
  ],
  o: [
    [[0, -0.35], [0.5, 0], [0.5, 0.6], [0, 0.95], [-0.5, 0.6], [-0.5, 0], [0, -0.35]],
  ],
  p: [
    [[-0.5, -0.25], [-0.5, 1.25]],
    [[-0.5, -0.25], [0.1, -0.3], [0.55, 0.1], [0.55, 0.55], [0.1, 0.9], [-0.5, 0.9]],
  ],
  q: [
    [[0.5, -0.25], [0.5, 1.25]],
    [[0.5, -0.25], [-0.1, -0.3], [-0.55, 0.1], [-0.55, 0.55], [-0.1, 0.9], [0.5, 0.9]],
  ],
  r: [
    [[-0.4, -0.25], [-0.4, 0.95]],
    [[-0.4, 0.1], [0, -0.25], [0.45, -0.15]],
  ],
  s: [
    [[0.4, -0.1], [0.1, -0.35], [-0.4, -0.15], [0, 0.25], [0.45, 0.55], [0.1, 0.9], [-0.45, 0.7]],
  ],
  t: [
    [[0, -0.8], [0, 0.75], [0.3, 0.95]],
    [[-0.4, -0.2], [0.4, -0.2]],
  ],
  u: [
    [[-0.5, -0.25], [-0.5, 0.6], [0, 0.95], [0.5, 0.6], [0.5, -0.25]],
    [[0.5, 0.4], [0.5, 0.95]],
  ],
  v: [
    [[-0.55, -0.25], [0, 0.95], [0.55, -0.25]],
  ],
  w: [
    [[-0.7, -0.25], [-0.4, 0.95], [0, 0.1], [0.4, 0.95], [0.7, -0.25]],
  ],
  x: [
    [[-0.5, -0.25], [0.5, 0.95]],
    [[0.5, -0.25], [-0.5, 0.95]],
  ],
  y: [
    [[-0.5, -0.25], [0, 0.5], [0.5, -0.25]],
    [[0, 0.5], [-0.2, 1.25]],
  ],
  z: [
    [[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.95], [0.5, 0.95]],
  ],
};

interface NegativeZone {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

const NEGATIVE_SPACES: Record<string, NegativeZone[]> = {
  // Uppercase
  A: [
    { xMin: -0.22, xMax: 0.22, yMin: -0.55, yMax: 0.05 }, // upper triangle hole
    { xMin: -0.28, xMax: 0.28, yMin: 0.45, yMax: 0.95 },  // open space below crossbar
  ],
  B: [
    { xMin: -0.25, xMax: 0.2, yMin: -0.7, yMax: -0.25 },  // top loop hole
    { xMin: -0.25, xMax: 0.25, yMin: 0.25, yMax: 0.7 },   // bottom loop hole
    { xMin: 0.35, xMax: 0.8, yMin: -0.15, yMax: 0.15 },   // waist notch
  ],
  C: [
    { xMin: 0.15, xMax: 0.75, yMin: -0.35, yMax: 0.35 },  // open right mouth
  ],
  D: [
    { xMin: -0.2, xMax: 0.3, yMin: -0.55, yMax: 0.55 },   // inner counter
  ],
  O: [
    { xMin: -0.35, xMax: 0.35, yMin: -0.55, yMax: 0.55 }, // center hole
  ],
  P: [
    { xMin: -0.2, xMax: 0.25, yMin: -0.7, yMax: -0.25 },  // upper loop hole
    { xMin: 0.0, xMax: 0.7, yMin: 0.2, yMax: 0.95 },      // bottom-right open area
  ],
  Q: [
    { xMin: -0.35, xMax: 0.35, yMin: -0.55, yMax: 0.55 }, // center hole
  ],
  R: [
    { xMin: -0.2, xMax: 0.25, yMin: -0.7, yMax: -0.25 },  // upper loop hole
  ],
  // Lowercase
  a: [
    { xMin: -0.2, xMax: 0.15, yMin: 0.0, yMax: 0.55 },    // lower loop hole
  ],
  b: [
    { xMin: -0.15, xMax: 0.25, yMin: 0.15, yMax: 0.65 },  // loop hole
  ],
  d: [
    { xMin: -0.25, xMax: 0.15, yMin: 0.15, yMax: 0.65 },  // loop hole
  ],
  e: [
    { xMin: -0.2, xMax: 0.2, yMin: -0.15, yMax: 0.18 },   // eye hole
  ],
  o: [
    { xMin: -0.25, xMax: 0.25, yMin: 0.0, yMax: 0.65 },   // center hole
  ],
  p: [
    { xMin: -0.15, xMax: 0.25, yMin: 0.1, yMax: 0.65 },   // loop hole
  ],
  q: [
    { xMin: -0.25, xMax: 0.15, yMin: 0.1, yMax: 0.65 },   // loop hole
  ],
};

/**
 * Detects whether the user simply drew a 4-sided bounding box / rectangle around the letter.
 */
function isBoxPerimeterCheat(userPoints: Point[]): boolean {
  if (userPoints.length < 24) return false;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of userPoints) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const width = maxX - minX;
  const height = maxY - minY;
  if (width < 50 || height < 75) return false;

  function isContinuousEdge(
    pts: Point[],
    getCoord: (p: Point) => number,
    getPerp: (p: Point) => number,
    minCoord: number,
    maxCoord: number,
    targetPerp: number,
    perpMargin = 14
  ): boolean {
    const edgePts = pts.filter((p) => Math.abs(getPerp(p) - targetPerp) <= perpMargin);
    if (edgePts.length < 6) return false;
    const span = maxCoord - minCoord;
    const bins = [0, 0, 0, 0];
    for (const p of edgePts) {
      const frac = (getCoord(p) - minCoord) / span;
      const binIdx = Math.min(3, Math.max(0, Math.floor(frac * 4)));
      bins[binIdx]++;
    }
    return bins.every((c) => c >= 1);
  }

  const topCont = isContinuousEdge(userPoints, (p) => p.x, (p) => p.y, minX, maxX, minY, 14);
  const botCont = isContinuousEdge(userPoints, (p) => p.x, (p) => p.y, minX, maxX, maxY, 14);
  const leftCont = isContinuousEdge(userPoints, (p) => p.y, (p) => p.x, minY, maxY, minX, 14);
  const rightCont = isContinuousEdge(userPoints, (p) => p.y, (p) => p.x, minY, maxY, maxX, 14);

  // 4 corners presence check (within 14px)
  const cornerTol = 14;
  const hasTL = userPoints.some((p) => Math.hypot(p.x - minX, p.y - minY) <= cornerTol);
  const hasTR = userPoints.some((p) => Math.hypot(p.x - maxX, p.y - minY) <= cornerTol);
  const hasBR = userPoints.some((p) => Math.hypot(p.x - maxX, p.y - maxY) <= cornerTol);
  const hasBL = userPoints.some((p) => Math.hypot(p.x - minX, p.y - maxY) <= cornerTol);

  const all4Corners = hasTL && hasTR && hasBR && hasBL;
  const all4Edges = topCont && botCont && leftCont && rightCont;

  return all4Corners && all4Edges;
}

/**
 * Returns distinct stroke segments of a letter, mapped to canvas coordinates.
 */
export function getLetterStrokeSegments(
  char: string,
  isUpper: boolean,
  canvasWidth: number,
  canvasHeight: number
): Point[][] {
  const dictionary = isUpper ? UPPERCASE_SKELETONS : LOWERCASE_SKELETONS;
  const key = isUpper ? char.toUpperCase() : char.toLowerCase();
  const strokes = dictionary[key] || UPPERCASE_SKELETONS[char.toUpperCase()];

  if (!strokes || strokes.length === 0) {
    return [];
  }

  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2 - 5;
  const scaleX = isUpper ? 65 : 55;
  const scaleY = isUpper ? 85 : 70;

  const segments: Point[][] = [];

  for (const stroke of strokes) {
    const strokePoints: Point[] = [];
    if (stroke.length === 1) {
      // Single dot (like dot over i or j)
      strokePoints.push({
        x: cx + stroke[0][0] * scaleX,
        y: cy + stroke[0][1] * scaleY,
      });
      segments.push(strokePoints);
      continue;
    }

    for (let i = 0; i < stroke.length - 1; i++) {
      const [x1, y1] = stroke[i];
      const [x2, y2] = stroke[i + 1];

      const px1 = cx + x1 * scaleX;
      const py1 = cy + y1 * scaleY;
      const px2 = cx + x2 * scaleX;
      const py2 = cy + y2 * scaleY;

      const dist = Math.hypot(px2 - px1, py2 - py1);
      const steps = Math.max(1, Math.round(dist / 12));

      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        strokePoints.push({
          x: px1 + (px2 - px1) * t,
          y: py1 + (py2 - py1) * t,
        });
      }
    }

    const last = stroke[stroke.length - 1];
    strokePoints.push({
      x: cx + last[0] * scaleX,
      y: cy + last[1] * scaleY,
    });

    segments.push(strokePoints);
  }

  return segments;
}

/**
 * Samples points along the normalized skeleton of a letter, mapped to canvas coordinates.
 */
export function getLetterTargetPoints(
  char: string,
  isUpper: boolean,
  canvasWidth: number,
  canvasHeight: number
): Point[] {
  const segments = getLetterStrokeSegments(char, isUpper, canvasWidth, canvasHeight);
  return segments.flat();
}

/**
 * Evaluates the user's handwriting trace against the target letter's true skeleton.
 */
export function evaluateLetterTracing(
  char: string,
  isUpper: boolean,
  userPoints: Point[],
  canvasWidth: number,
  canvasHeight: number
): TracingEvaluationResult {
  const charDisplay = isUpper ? char.toUpperCase() : char.toLowerCase();

  // 1. Empty Check
  if (!userPoints || userPoints.length === 0) {
    return {
      status: 'empty',
      starsAwarded: 0,
      scorePercent: 0,
      isLeftToRight: false,
      coveragePercent: 0,
      accuracyPercent: 0,
      titleEn: 'Start Tracing! ✍️',
      titleHe: 'בואו נתחיל לכתוב! ✍️',
      messageEn: "You haven't written anything yet! Follow the letter outline with your finger.",
      messageHe: 'עדיין לא ציירתם דבר! עקבו עם האצבע אחרי קווי האות כדי לתרגל כתיבה.',
    };
  }

  // 2. Minimum stroke length check
  if (userPoints.length < 12) {
    return {
      status: 'incomplete',
      starsAwarded: 0,
      scorePercent: Math.min(25, Math.round((userPoints.length / 15) * 25)),
      isLeftToRight: false,
      coveragePercent: 5,
      accuracyPercent: 20,
      titleEn: 'Too Short! ✏️',
      titleHe: 'קצר מדי! ✏️',
      messageEn: 'Keep tracing along the full shape of the letter to finish it.',
      messageHe: 'התרגול קצר מדי! המשיכו לכתוב לאורך כל קווי האות כדי להשלים אותה.',
    };
  }

  // 3. Box Perimeter Cheat Check
  if (isBoxPerimeterCheat(userPoints)) {
    return {
      status: 'incomplete',
      starsAwarded: 0,
      scorePercent: 20,
      isLeftToRight: false,
      coveragePercent: 20,
      accuracyPercent: 15,
      titleEn: 'That looks like a box! 📦',
      titleHe: 'ציירתם מסגרת! 📦',
      messageEn: `Trace along the real lines and curves of the letter ${charDisplay}, not a box around it!`,
      messageHe: `ציירתם מסגרת מרובעת! עקבו אחרי קווי האות ${charDisplay} עצמה עם האצבע.`,
    };
  }

  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2 - 5;
  const scaleX = isUpper ? 65 : 55;
  const scaleY = isUpper ? 85 : 70;

  // 4. Negative Space / Hole check (detects solid filled scribbles)
  const lookupKey = isUpper ? char.toUpperCase() : char.toLowerCase();
  const holes = NEGATIVE_SPACES[lookupKey] || NEGATIVE_SPACES[char.toUpperCase()] || [];
  if (holes.length > 0) {
    let holeHits = 0;
    for (const p of userPoints) {
      const nx = (p.x - cx) / scaleX;
      const ny = (p.y - cy) / scaleY;
      for (const h of holes) {
        if (nx >= h.xMin && nx <= h.xMax && ny >= h.yMin && ny <= h.yMax) {
          holeHits++;
          break;
        }
      }
    }
    const holeRatio = holeHits / userPoints.length;
    if (holeRatio > 0.16) {
      return {
        status: 'incomplete',
        starsAwarded: 0,
        scorePercent: Math.max(10, Math.round((1 - holeRatio) * 35)),
        isLeftToRight: false,
        coveragePercent: 30,
        accuracyPercent: 20,
        titleEn: "Don't fill the box! ✏️",
        titleHe: 'אל תצבעו את הכל! ✏️',
        messageEn: `Follow only the outline of the letter ${charDisplay} with your finger without coloring the whole area.`,
        messageHe: `עקבו עם האצבע רק על קווי האות ${charDisplay}, אל תמלאו את כל השטח בצבע.`,
      };
    }
  }

  // 5. Segment-Level Target Evaluation
  const strokeSegments = getLetterStrokeSegments(char, isUpper, canvasWidth, canvasHeight);
  const allTargetPoints = strokeSegments.flat();

  // Fallback if letter has no skeleton definition
  if (allTargetPoints.length === 0) {
    return {
      status: 'good',
      starsAwarded: 2,
      scorePercent: 80,
      isLeftToRight: true,
      coveragePercent: 80,
      accuracyPercent: 80,
      titleEn: 'Good Effort! 🌟🌟',
      titleHe: 'עבודה יפה! 🌟🌟',
      messageEn: `Nice tracing practice for the letter ${charDisplay}! You earned 2 stars!`,
      messageHe: `תרגול יפה של האות ${charDisplay}! זכיתם ב-2 כוכבים!`,
    };
  }

  // Strict & forgiving finger tolerance radius (20px)
  const TOLERANCE_RADIUS = 20;

  // Evaluate each stroke segment individually
  const segmentCoverages = strokeSegments.map((segPts) => {
    let covered = 0;
    for (const tp of segPts) {
      if (userPoints.some((up) => Math.hypot(up.x - tp.x, up.y - tp.y) <= TOLERANCE_RADIUS)) {
        covered++;
      }
    }
    return covered / segPts.length;
  });

  const minSegmentCoverage = Math.min(...segmentCoverages);
  const totalCoveredTargets = strokeSegments.reduce((sum, segPts, idx) => {
    return sum + segmentCoverages[idx] * segPts.length;
  }, 0);
  const overallCoverage = totalCoveredTargets / allTargetPoints.length;

  // User stroke accuracy
  let onTargetUserPoints = 0;
  for (const up of userPoints) {
    if (allTargetPoints.some((tp) => Math.hypot(up.x - tp.x, up.y - tp.y) <= TOLERANCE_RADIUS)) {
      onTargetUserPoints++;
    }
  }
  const accuracyRatio = onTargetUserPoints / userPoints.length;

  // Direction Check (Did the child generally write left-to-right?)
  const quarter = Math.max(2, Math.floor(userPoints.length / 4));
  const startPoints = userPoints.slice(0, quarter);
  const endPoints = userPoints.slice(userPoints.length - quarter);
  const avgStartX = startPoints.reduce((sum, p) => sum + p.x, 0) / startPoints.length;
  const avgEndX = endPoints.reduce((sum, p) => sum + p.x, 0) / endPoints.length;
  const isLeftToRight = avgEndX - avgStartX > 5;

  const coveragePercent = Math.round(overallCoverage * 100);
  const accuracyPercent = Math.round(accuracyRatio * 100);

  // Require every essential stroke to have at least 45% coverage
  const allStrokesPresent = minSegmentCoverage >= 0.45;

  let status: 'incomplete' | 'good' | 'excellent' = 'incomplete';
  let starsAwarded = 0;
  let scorePercent = 0;

  if (!allStrokesPresent || overallCoverage < 0.55 || accuracyRatio < 0.45) {
    scorePercent = Math.min(65, Math.round(20 + overallCoverage * 30 + accuracyRatio * 20));
    status = 'incomplete';
    starsAwarded = 0;
  } else {
    // Real, recognizable letter tracing
    scorePercent = Math.min(100, Math.round(35 + overallCoverage * 45 + accuracyRatio * 20));

    if (scorePercent >= 82 && overallCoverage >= 0.72 && minSegmentCoverage >= 0.60 && accuracyRatio >= 0.55) {
      status = 'excellent';
      starsAwarded = 3;
    } else {
      status = 'good';
      starsAwarded = 2;
    }
  }

  const titleEn =
    status === 'excellent'
      ? 'Sensational Handwriting! 🌟🌟🌟'
      : status === 'good'
      ? 'Good Effort! 🌟🌟'
      : minSegmentCoverage < 0.45
      ? 'Almost there! ✏️'
      : 'Keep Practicing! ✏️';

  const titleHe =
    status === 'excellent'
      ? 'כתיבה מעולה ומדויקת! 🌟🌟🌟'
      : status === 'good'
      ? 'עבודה יפה! 🌟🌟'
      : minSegmentCoverage < 0.45
      ? 'כמעט הצלחתם! ✏️'
      : 'המשיכו לתרגל! ✏️';

  const messageEn =
    status === 'excellent'
      ? `You traced the letter ${charDisplay} beautifully! You earned 3 stars!`
      : status === 'good'
      ? `Nice tracing practice for the letter ${charDisplay}! You earned 2 stars!`
      : minSegmentCoverage < 0.45
      ? `You missed some strokes of the letter ${charDisplay}! Make sure to trace every line.`
      : `Trace more closely along the lines of the letter ${charDisplay} to complete it!`;

  const messageHe =
    status === 'excellent'
      ? `עקבתם אחרי האות ${charDisplay} בצורה מושלמת וזכיתם ב-3 כוכבים!`
      : status === 'good'
      ? `תרגול יפה של האות ${charDisplay}! זכיתם ב-2 כוכבים!`
      : minSegmentCoverage < 0.45
      ? `פספסתם חלק מקווי האות ${charDisplay}! הקפידו לעקוב אחרי כל הקווים שלה.`
      : `עקבו מקרוב יותר אחרי קווי האות ${charDisplay} כדי להשלים את התרגול!`;

  return {
    status,
    starsAwarded,
    scorePercent,
    isLeftToRight,
    coveragePercent,
    accuracyPercent,
    titleEn,
    titleHe,
    messageEn,
    messageHe,
  };
}
