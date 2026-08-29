'use client';

export const SESSION_KEY = 'ball-system:admin';
export const DEFAULT_USERNAME = 'admin';
export const DEFAULT_PASSWORD = 'admin123';

/**
 * NOTE: this gate lives entirely in the browser, next to the data it guards.
 * It keeps students and parents out of the teacher's controls on a shared
 * device — it is not a security boundary, because anyone who can open devtools
 * can read the same localStorage the app reads. Real protection needs a server
 * that holds the data and checks the password before returning it.
 */

function toHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** Non-crypto fallback for insecure contexts where subtle crypto is missing. */
function weakHash(input) {
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < input.length; i += 1) {
    const code = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193) >>> 0;
    h2 = Math.imul(h2 + code, 0x85ebca6b) >>> 0;
  }
  return `w${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}

export function makeSalt() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return toHex(crypto.getRandomValues(new Uint8Array(12)));
  }
  return Math.random().toString(36).slice(2, 14);
}

export async function hashPassword(password, salt) {
  const input = `${salt}:${password}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(input)
      );
      return toHex(digest);
    } catch (error) {
      /* falls through to the weak hash below */
    }
  }
  return weakHash(input);
}

/**
 * Until a password has been set, the built-in default is accepted so a teacher
 * can get in on first run.
 */
export async function verifyCredentials(admin, username, password) {
  const expectedUser = (admin?.username || DEFAULT_USERNAME).trim().toLowerCase();
  if (username.trim().toLowerCase() !== expectedUser) return false;
  if (!admin?.hash) return password === DEFAULT_PASSWORD;
  const hash = await hashPassword(password, admin.salt);
  return hash === admin.hash;
}

export async function buildCredentials(username, password) {
  const salt = makeSalt();
  return {
    username: username.trim() || DEFAULT_USERNAME,
    salt,
    hash: await hashPassword(password, salt),
    updatedAt: Date.now(),
  };
}

export function usingDefaultPassword(admin) {
  return !admin?.hash;
}

export function readSession() {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const { until } = JSON.parse(raw);
    if (typeof until !== 'number' || until < Date.now()) {
      window.sessionStorage.removeItem(SESSION_KEY);
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

export function writeSession(hours = 8) {
  try {
    window.sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ until: Date.now() + hours * 3600000 })
    );
  } catch (error) {
    /* private mode — the session simply will not persist */
  }
}

export function clearSession() {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch (error) {
    /* nothing to clear */
  }
}

/* --------------------------------------------------------------------------
 * Logins without email
 *
 * Supabase Auth identifies an account by an email address, but a teacher
 * should not need one to keep a grade book. So the login they type is turned
 * into a stable internal address and never shown back to them.
 *
 * Two consequences worth knowing:
 *   - the domain must have a real TLD, because Supabase rejects `.local` and
 *     `.invalid` outright;
 *   - "Confirm email" has to be off in the project, since no message could
 *     ever be delivered to that address. `AuthContext` detects that case and
 *     says so in plain words rather than failing silently.
 * ----------------------------------------------------------------------- */

export const LOGIN_DOMAIN = 'bahosystem.uz';

/**
 * What a login may contain: letters, digits, dot, dash, underscore, starting
 * with a letter or a digit. Two characters is enough — the login is not a
 * secret, the password is.
 */
export const LOGIN_PATTERN = /^[a-z0-9][a-z0-9._-]{1,31}$/;

export function normalizeLogin(login) {
  return String(login || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '');
}

export function isValidLogin(login) {
  return LOGIN_PATTERN.test(normalizeLogin(login));
}

/** The internal address for a login. Never rendered anywhere. */
export function addressForLogin(login) {
  return `${normalizeLogin(login)}@${LOGIN_DOMAIN}`;
}

/** Reads the login back out of an account, without ever exposing an address. */
export function loginFromUser(user) {
  if (!user) return '';
  const meta = user.user_metadata || {};
  if (meta.login) return meta.login;
  const address = user.email || '';
  return address.endsWith(`@${LOGIN_DOMAIN}`) ? address.slice(0, -LOGIN_DOMAIN.length - 1) : '';
}
