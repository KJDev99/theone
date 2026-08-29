/**
 * Students are drawn as monogram tiles rather than picture avatars: the
 * initials of a real name are always recognisable to the class, never repeat
 * the way a small emoji set does, and need nothing chosen when a name is added.
 */

export const ACCENTS = [
  { key: 'indigo', from: '#6D6DFB', to: '#9B5BF0' },
  { key: 'rose', from: '#FF6E93', to: '#F2547D' },
  { key: 'teal', from: '#2BD9A2', to: '#0FA3C7' },
  { key: 'amber', from: '#FFB84D', to: '#F0894B' },
  { key: 'violet', from: '#A66BFF', to: '#7C7CFF' },
  { key: 'sky', from: '#48B7F5', to: '#3B82F6' },
  { key: 'lime', from: '#8FD14F', to: '#2BB673' },
  { key: 'coral', from: '#FF8C5A', to: '#EF5F5F' },
  { key: 'plum', from: '#C56BD6', to: '#8A5BF0' },
  { key: 'mint', from: '#5AD9C0', to: '#35A0D0' },
  { key: 'sand', from: '#E0B173', to: '#C98A55' },
  { key: 'ocean', from: '#4F8CFF', to: '#3ECFCF' },
];

// Split on spaces and dashes only: an apostrophe belongs to the word in Uzbek
// names like O'ktam or Yo'ldoshev, so it must not start a new "word".
const WORD_BREAK = /[\s\-–—_,.]+/;
const LEADING_JUNK = /^[^\p{L}\p{N}]+/u;
const NOT_LETTER = /[^\p{L}\p{N}]/gu;

/** First letter of the first two words: "Aziza Karimova" -> "AK". */
export function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(WORD_BREAK)
    .map((part) => part.replace(LEADING_JUNK, ''))
    .filter(Boolean);

  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    return parts[0].replace(NOT_LETTER, '').slice(0, 2).toUpperCase() || '?';
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function hash(input) {
  let value = 0x811c9dc5;
  const text = String(input || '');
  for (let i = 0; i < text.length; i += 1) {
    value = Math.imul(value ^ text.charCodeAt(i), 0x01000193) >>> 0;
  }
  return value;
}

/** Stable colour for a student: their chosen accent, or one derived from the name. */
export function accentFor(student) {
  if (student && student.accent) {
    const chosen = ACCENTS.find((accent) => accent.key === student.accent);
    if (chosen) return chosen;
  }
  const seed = student ? student.id || student.name : '';
  return ACCENTS[hash(seed) % ACCENTS.length];
}

export function gradientFor(student) {
  const accent = accentFor(student);
  return `linear-gradient(135deg, ${accent.from}, ${accent.to})`;
}
