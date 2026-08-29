'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useApp } from './AppContext';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { fetchOwnerId } from '@/lib/backend';
import {
  addressForLogin,
  buildCredentials,
  clearSession,
  isValidLogin,
  loginFromUser,
  readSession,
  usingDefaultPassword,
  verifyCredentials,
  writeSession,
} from '@/lib/auth';

const AuthContext = createContext(null);

const REMOTE = isSupabaseConfigured();

/**
 * Supabase answers a refused sign-in with one of a few distinct reasons, and
 * they need very different things from the teacher: a password nobody can
 * guess their way out of, or an account that was created in the dashboard
 * without ticking "Auto Confirm User". Reporting both as "wrong password"
 * sends them looking in the wrong place.
 */
function signInCode(error) {
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  if (code === 'email_not_confirmed' || message.includes('not confirmed')) {
    return 'notConfirmed';
  }
  if (code === 'over_request_rate_limit' || message.includes('rate limit')) {
    return 'tooMany';
  }
  return 'wrong';
}

/**
 * Authentication for the teacher panel.
 *
 * With Supabase configured this is real authentication: the password is
 * checked by the server and the database itself refuses writes from anyone
 * who is not the one teacher named in `app_owner`. The teacher signs in with
 * a plain login — there is no email anywhere in the interface, and there is no
 * way to register: the single account is created once, in the Supabase
 * dashboard.
 *
 * Without it, the app falls back to the browser-only password from before —
 * useful for a quick local try, but it only hides the controls.
 */
export function AuthProvider({ children }) {
  const { settings, actions } = useApp();
  const [session, setSession] = useState(null);
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);
  // undefined while unknown, null when the seat is unclaimed, else the id.
  const [ownerId, setOwnerId] = useState(undefined);

  useEffect(() => {
    if (!REMOTE) {
      setAuthed(readSession());
      setChecked(true);
      return undefined;
    }

    const supabase = getSupabase();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session || null);
      setAuthed(Boolean(data.session));
      setChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next || null);
      setAuthed(Boolean(next));
      setChecked(true);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Who is allowed to write. Asked once, and again whenever the session
  // changes, so signing in as the wrong account is caught immediately.
  useEffect(() => {
    if (!REMOTE) return undefined;
    let active = true;
    fetchOwnerId().then((id) => {
      if (active) setOwnerId(id);
    });
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const login = useCallback(
    async (identifier, password) => {
      if (REMOTE) {
        if (!isValidLogin(identifier)) return { ok: false, code: 'badLogin' };
        const { error } = await getSupabase().auth.signInWithPassword({
          email: addressForLogin(identifier),
          password,
        });
        if (error) return { ok: false, code: signInCode(error), message: error.message };
        return { ok: true };
      }

      const ok = await verifyCredentials(settings.admin, identifier, password);
      if (!ok) return { ok: false, code: 'wrong' };
      writeSession();
      setAuthed(true);
      return { ok: true };
    },
    [settings.admin]
  );

  const logout = useCallback(async () => {
    if (REMOTE) {
      await getSupabase().auth.signOut();
      return;
    }
    clearSession();
    setAuthed(false);
  }, []);

  /** Changes the password, and the name shown on reports. The login is fixed. */
  const changeCredentials = useCallback(
    async (displayName, password) => {
      if (REMOTE) {
        const { error } = await getSupabase().auth.updateUser({
          password,
          data: { display_name: displayName },
        });
        if (error) return { ok: false, message: error.message };
        actions.updateSettings({ teacherName: displayName });
        return { ok: true };
      }

      const admin = await buildCredentials(displayName, password);
      actions.updateSettings({ admin });
      writeSession();
      setAuthed(true);
      return { ok: true };
    },
    [actions]
  );

  const value = useMemo(() => {
    const user = session?.user || null;
    const loginName = REMOTE ? loginFromUser(user) : settings.admin?.username || 'admin';
    return {
      remote: REMOTE,
      authed,
      checked,
      login,
      logout,
      changeCredentials,
      user,
      /**
       * true when this account holds the single teacher seat, false when it
       * plainly does not, and null while that cannot be established — an
       * older project, or the network. A null must never lock anyone out.
       */
      isOwner:
        !REMOTE || ownerId === undefined
          ? null
          : Boolean(user && ownerId && user.id === ownerId),
      ownerClaimed: ownerId === undefined ? null : ownerId !== null,
      /** The login typed at sign-in. Fixed once the account exists. */
      loginName,
      /** The name shown on reports and in the top bar. */
      username: REMOTE
        ? user?.user_metadata?.display_name || loginName
        : settings.admin?.username || 'admin',
      isDefaultPassword: REMOTE ? false : usingDefaultPassword(settings.admin),
    };
  }, [authed, checked, login, logout, changeCredentials, session, settings.admin, ownerId]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
