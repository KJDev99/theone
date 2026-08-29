/**
 * Levels turn an average mark into something a student can chase between
 * resets: the leaderboard starts over every week, but a level is a plain
 * statement about the quality of the work and is easy to explain to a parent.
 *
 * Thresholds are averages on the 0-100 scale, not lifetime totals.
 */
export const LEVELS = [
  { key: 'start', min: 0, icon: 'sprout', color: '#8A92A9' },
  { key: 'bronze', min: 50, icon: 'medal', color: '#D89A67' },
  { key: 'silver', min: 65, icon: 'award', color: '#7C8AA5' },
  { key: 'gold', min: 75, icon: 'trophy', color: '#F0B429' },
  { key: 'diamond', min: 86, icon: 'gem', color: '#0FA3C7' },
  { key: 'legend', min: 95, icon: 'crown', color: '#8A5BF0' },
];

export function levelFor(average) {
  const value = Math.min(Math.max(Number(average) || 0, 0), 100);
  let index = 0;
  for (let i = 0; i < LEVELS.length; i += 1) {
    if (value >= LEVELS[i].min) index = i;
  }
  const level = LEVELS[index];
  const next = LEVELS[index + 1] || null;
  const span = next ? next.min - level.min : 1;
  const progress = next ? Math.min((value - level.min) / span, 1) : 1;

  return {
    level,
    index,
    next,
    progress,
    toNext: next ? Math.round(Math.max(next.min - value, 0) * 10) / 10 : 0,
  };
}

/**
 * The five-point mark an Uzbek school report still uses, derived from the
 * hundred-point one so both readings agree.
 */
export function fiveScale(grade) {
  const value = Number(grade) || 0;
  if (value >= 86) return 5;
  if (value >= 71) return 4;
  if (value >= 60) return 3;
  return 2;
}

/** Colour bucket for a single mark — used by pills, cells and charts alike. */
export function gradeTone(grade, { passMark = 60, excellentMark = 86 } = {}) {
  const value = Number(grade) || 0;
  if (value >= excellentMark) return 'success';
  if (value >= passMark) return 'primary';
  if (value >= passMark - 15) return 'warning';
  return 'danger';
}

export const TONE_COLORS = {
  success: '#12A87A',
  primary: '#5B5BF0',
  warning: '#E9A21B',
  danger: '#E5484D',
};

export function gradeColor(grade, options) {
  return TONE_COLORS[gradeTone(grade, options)];
}
