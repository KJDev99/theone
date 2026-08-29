// All date keys are plain local-time 'YYYY-MM-DD' strings so that a school day
// never shifts because of a timezone conversion.

const pad = (n) => String(n).padStart(2, '0');

export function toKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey() {
  return toKey(new Date());
}

export function addDays(key, amount) {
  const d = fromKey(key);
  d.setDate(d.getDate() + amount);
  return toKey(d);
}

export function diffInDays(aKey, bKey) {
  const a = fromKey(aKey);
  const b = fromKey(bKey);
  return Math.round((a - b) / 86400000);
}

/** Monday-based start of week. */
export function startOfWeek(key) {
  const d = fromKey(key);
  const shift = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - shift);
  return toKey(d);
}

export function endOfWeek(key) {
  return addDays(startOfWeek(key), 6);
}

export function startOfMonth(key) {
  const d = fromKey(key);
  return toKey(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function endOfMonth(key) {
  const d = fromKey(key);
  return toKey(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

/** ISO-8601 week number, used as the stable identifier of a weekly period. */
export function isoWeek(key) {
  const d = fromKey(key);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  firstThursday.setDate(
    firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7)
  );
  const week = 1 + Math.round((target - firstThursday) / (7 * 86400000));
  return { year: target.getFullYear(), week };
}

export function weekKey(key) {
  const { year, week } = isoWeek(key);
  return `${year}-W${pad(week)}`;
}

export function monthKey(key) {
  return key.slice(0, 7);
}

export function periodKeyOf(period, key) {
  return period === 'week' ? weekKey(key) : monthKey(key);
}

export function periodRange(period, key) {
  return period === 'week'
    ? { from: startOfWeek(key), to: endOfWeek(key) }
    : { from: startOfMonth(key), to: endOfMonth(key) };
}

export function shiftPeriod(period, key, amount) {
  if (period === 'week') return addDays(key, amount * 7);
  const d = fromKey(key);
  return toKey(new Date(d.getFullYear(), d.getMonth() + amount, 1));
}

export function inRange(key, from, to) {
  return key >= from && key <= to;
}

export function daysBetween(fromKey_, toKey_) {
  const out = [];
  let cursor = fromKey_;
  let guard = 0;
  while (cursor <= toKey_ && guard < 400) {
    out.push(cursor);
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return out;
}

const LOCALES = { uz: 'uz-UZ', en: 'en-US' };

export function formatDate(key, locale = 'en', opts) {
  return fromKey(key).toLocaleDateString(
    LOCALES[locale] || 'en-US',
    opts || { day: 'numeric', month: 'short', year: 'numeric' }
  );
}

export function formatShortDate(key, locale = 'en') {
  return formatDate(key, locale, { day: 'numeric', month: 'short' });
}

export function formatMonth(key, locale = 'en') {
  return fromKey(`${key.slice(0, 7)}-01`).toLocaleDateString(
    LOCALES[locale] || 'en-US',
    { month: 'long', year: 'numeric' }
  );
}

export function weekdayShort(key, locale = 'en') {
  return fromKey(key).toLocaleDateString(LOCALES[locale] || 'en-US', {
    weekday: 'short',
  });
}

export function isWeekend(key) {
  const day = fromKey(key).getDay();
  return day === 0 || day === 6;
}

export function labelForPeriod(period, key, locale = 'en') {
  if (period === 'month') return formatMonth(key, locale);
  const { from, to } = periodRange('week', key);
  return `${formatShortDate(from, locale)} — ${formatShortDate(to, locale)}`;
}
