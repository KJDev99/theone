export const STORAGE_KEY = 'ball-system:v1';

/**
 * Theme and language belong to the device you are reading on, not to the
 * teacher's account, so they stay in this browser even when everything else
 * moves to Supabase.
 */
export const PREFS_KEY = 'ball-system:prefs';
export const DEVICE_KEYS = ['theme', 'locale'];

/** Never leaves this browser: the fallback password used when there is no Supabase project. */
export const LOCAL_ONLY_KEYS = ['admin'];

export const SCHEMA_VERSION = 2;

/** Everything in the app is a mark out of one hundred. */
export const MAX_GRADE = 100;
export const MIN_GRADE = 0;

export const GROUP_COLORS = [
  '#5B5BF0',
  '#F2547D',
  '#12A87A',
  '#E9A21B',
  '#8A5BF0',
  '#0FA3C7',
  '#EF6C3B',
  '#3B82F6',
];

export const GROUP_EMOJIS = ['📘', '🧮', '🔬', '🎨', '🌍', '🎼', '💻', '🏅'];

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now()
    .toString(36)
    .slice(-4)}`;
}

/** A mark is always a whole number between 0 and 100. */
export function clampGrade(value, max = MAX_GRADE) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) return 0;
  return Math.min(Math.max(number, MIN_GRADE), max);
}

export const defaultSettings = {
  locale: 'uz',
  theme: 'light',
  /** The one-tap marks on the grading screen. */
  quickGrades: [100, 90, 80, 70, 60],
  /** At or above this a mark counts as a pass — it drives streaks and colours. */
  passMark: 60,
  /** At or above this a mark is shown as excellent. */
  excellentMark: 86,
  awardStars: { week: [3, 2, 1], month: [8, 5, 3] },
  streakGoal: 5,
  skipWeekends: true,
  autoSettle: true,
  teacherName: '',
  schoolName: '',
  admin: { username: 'admin', salt: null, hash: null },
};

/** Splits a settings patch into "stays on this device" and "belongs to the account". */
export function splitSettings(settings) {
  const device = {};
  const teacher = {};
  Object.entries(settings || {}).forEach(([key, value]) => {
    if (DEVICE_KEYS.includes(key)) device[key] = value;
    else if (!LOCAL_ONLY_KEYS.includes(key)) teacher[key] = value;
  });
  return { device, teacher };
}

/** Theme and language for this browser, falling back to the system colour scheme. */
export function devicePreferences() {
  const prefs = {};
  try {
    Object.assign(prefs, JSON.parse(window.localStorage.getItem(PREFS_KEY) || '{}'));
  } catch (error) {
    /* a private window starts from the defaults */
  }

  if (prefs.theme !== 'dark' && prefs.theme !== 'light') {
    prefs.theme =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  }
  if (typeof prefs.locale !== 'string') prefs.locale = defaultSettings.locale;

  return { theme: prefs.theme, locale: prefs.locale };
}

export function emptyState() {
  return {
    version: SCHEMA_VERSION,
    groups: [],
    students: [],
    entries: [],
    awards: [],
    settings: { ...defaultSettings },
  };
}

/** Quick marks saved before the app moved to a 0-100 scale are meaningless now. */
function readQuickGrades(raw) {
  const list = Array.isArray(raw) ? raw.map((value) => clampGrade(value)) : [];
  const usable = [...new Set(list)].filter((value) => value > 0);
  if (usable.length < 2) return [...defaultSettings.quickGrades];
  return usable.sort((a, b) => b - a).slice(0, 6);
}

export function normalize(raw) {
  const base = emptyState();
  if (!raw || typeof raw !== 'object') return base;
  const incoming = raw.settings || {};

  return {
    ...base,
    ...raw,
    version: SCHEMA_VERSION,
    groups: Array.isArray(raw.groups) ? raw.groups : [],
    students: Array.isArray(raw.students) ? raw.students : [],
    entries: Array.isArray(raw.entries) ? raw.entries : [],
    awards: Array.isArray(raw.awards) ? raw.awards : [],
    settings: {
      ...defaultSettings,
      ...incoming,
      quickGrades: readQuickGrades(incoming.quickGrades),
      passMark: clampGrade(incoming.passMark ?? defaultSettings.passMark),
      excellentMark: clampGrade(incoming.excellentMark ?? defaultSettings.excellentMark),
      awardStars: {
        ...defaultSettings.awardStars,
        ...(incoming.awardStars || {}),
      },
      admin: {
        ...defaultSettings.admin,
        ...(incoming.admin || {}),
      },
    },
  };
}
