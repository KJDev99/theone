'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  GROUP_COLORS,
  GROUP_EMOJIS,
  PREFS_KEY,
  STORAGE_KEY,
  clampGrade,
  defaultSettings,
  devicePreferences,
  emptyState,
  normalize,
  splitSettings,
} from '@/lib/model';
import { ACCENTS } from '@/lib/identity';
import { pendingPeriods, settlePeriod } from '@/lib/calc';
import { periodRange, todayKey } from '@/lib/dates';
import { buildDemoState } from '@/lib/demo';
import { isSupabaseConfigured, getSupabase, PUBLIC_TEACHER_ID } from '@/lib/supabase';
import {
  loadProfileSettings,
  loadRemoteState,
  newId,
  remote,
  saveProfileSettings,
  subscribeToChanges,
} from '@/lib/backend';
import { remapIds } from '@/lib/migrate';

const AppContext = createContext(null);

const REMOTE = isSupabaseConfigured();

/**
 * The reducer only ever receives rows that are already fully built, so the
 * same object can be handed to the screen immediately and to the database a
 * moment later.
 */
function reducer(state, action) {
  switch (action.type) {
    case 'hydrate':
    case 'replace':
      return action.state;

    case 'data':
      return { ...state, ...action.data };

    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case 'group/add':
      return { ...state, groups: [...state.groups, action.group] };

    case 'group/update':
      return {
        ...state,
        groups: state.groups.map((group) =>
          group.id === action.id ? { ...group, ...action.patch } : group
        ),
      };

    case 'group/remove':
      return {
        ...state,
        groups: state.groups.filter((group) => group.id !== action.id),
        students: state.students.filter((student) => student.groupId !== action.id),
        entries: state.entries.filter((entry) => entry.groupId !== action.id),
        awards: state.awards.filter((award) => award.groupId !== action.id),
      };

    case 'student/add':
      return { ...state, students: [...state.students, ...action.students] };

    case 'student/update':
      return {
        ...state,
        students: state.students.map((student) =>
          student.id === action.id ? { ...student, ...action.patch } : student
        ),
      };

    case 'student/remove':
      return {
        ...state,
        students: state.students.filter((student) => student.id !== action.id),
        entries: state.entries.filter((entry) => entry.studentId !== action.id),
        awards: state.awards.filter((award) => award.studentId !== action.id),
      };

    case 'entry/add':
      return { ...state, entries: [...state.entries, ...action.entries] };

    case 'entry/remove':
      return {
        ...state,
        entries: state.entries.filter((entry) => entry.id !== action.id),
      };

    case 'entry/clear':
      return { ...state, entries: state.entries.filter(action.keep) };

    case 'award/add':
      return { ...state, awards: [...state.awards, ...action.awards] };

    case 'award/remove':
      return {
        ...state,
        awards: state.awards.filter((award) => award.id !== action.id),
      };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, emptyState);
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [celebration, setCelebration] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const settledRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ---- toasts ------------------------------------------------------------
  const toast = useCallback((message, tone = 'default') => {
    const id = newId();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 2800);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  // ---- loading -----------------------------------------------------------
  const refresh = useCallback(async (viewerId) => {
    const data = await loadRemoteState(viewerId);
    dispatch({ type: 'data', data });
    return data;
  }, []);

  /** Teacher settings live on the profile row; theme and language stay per device. */
  const loadSettings = useCallback(async (viewerId) => {
    const prefs = devicePreferences();

    if (viewerId) {
      const profile = await loadProfileSettings(viewerId);
      return { ...defaultSettings, ...(profile ? profile.settings : {}), ...prefs };
    }

    // Signed out: use the public teacher's settings when the project has just
    // one teacher, otherwise fall back to the defaults.
    try {
      const supabase = getSupabase();
      let query = supabase.from('profiles').select('id, settings').limit(2);
      if (PUBLIC_TEACHER_ID) query = query.eq('id', PUBLIC_TEACHER_ID);
      const { data } = await query;
      if (data && data.length === 1) {
        return { ...defaultSettings, ...(data[0].settings || {}), ...prefs };
      }
    } catch (error) {
      /* the public board still works on defaults */
    }
    return { ...defaultSettings, ...prefs };
  }, []);

  // ---- boot --------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    if (!REMOTE) {
      // Browser-only mode, exactly as the app behaved before Supabase.
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) dispatch({ type: 'hydrate', state: normalize(JSON.parse(raw)) });
      } catch (error) {
        console.warn('Could not read saved data', error);
      }
      setReady(true);
      return undefined;
    }

    const boot = async (viewerId) => {
      try {
        const [settings] = await Promise.all([loadSettings(viewerId), refresh(viewerId)]);
        if (cancelled) return;
        dispatch({ type: 'settings', patch: settings });
        setSyncError(null);
      } catch (error) {
        console.error('Could not load data from Supabase', error);
        if (!cancelled) setSyncError(error.message || 'load failed');
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    // Kept as locals rather than refs: React re-runs this effect on a Strict
    // Mode remount, and the load has to happen again when it does.
    let booted = false;
    let activeId = null;

    const applyUser = (id) => {
      if (cancelled) return;
      if (booted && activeId === id) return;
      booted = true;
      activeId = id;
      settledRef.current = false;
      setUserId(id);
      boot(id);
    };

    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data }) => {
      applyUser(data.session?.user?.id || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user?.id || null);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [loadSettings, refresh]);

  // ---- persistence / live updates ----------------------------------------
  useEffect(() => {
    if (REMOTE || !ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Could not save data', error);
    }
  }, [state, ready]);

  useEffect(() => {
    if (!REMOTE || !ready) return undefined;
    // Another device changed something: pull the tables again. Debounced, so a
    // teacher tapping ten points in a row causes one refetch and not ten.
    let timer = null;
    const unsubscribe = subscribeToChanges(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        refresh(userId).catch(() => {});
      }, 400);
    });
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [ready, userId, refresh]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.theme = state.settings.theme;
    document.documentElement.lang = state.settings.locale;
  }, [state.settings.theme, state.settings.locale]);

  /**
   * Every write follows the same shape: change the screen at once, then tell
   * the database. If the database says no, reload the truth and say so.
   */
  const commit = useCallback(
    async (work) => {
      if (!REMOTE) return true;
      if (!userId) {
        toast('Not signed in', 'danger');
        return false;
      }
      try {
        await work(userId);
        setSyncError(null);
        return true;
      } catch (error) {
        console.error('Supabase write failed', error);
        toast(error.message || 'Save failed', 'danger');
        setSyncError(error.message || 'save failed');
        refresh(userId).catch(() => {});
        return false;
      }
    },
    [userId, toast, refresh]
  );

  // ---- period settlement -------------------------------------------------
  const closePeriods = useCallback(
    (list) => {
      const current = stateRef.current;
      const targets = list && list.length ? list : pendingPeriods(current);
      if (targets.length === 0) return [];

      const settled = targets.flatMap((target) => settlePeriod(current, target));
      const awards = (settled.length > 0
        ? settled
        : targets.map((target) => ({
            ...target,
            studentId: null,
            rank: 0,
            stars: 0,
            points: 0,
            createdAt: Date.now(),
          }))
      ).map((award) => ({ note: '', ...award, id: newId() }));

      dispatch({ type: 'award/add', awards });
      commit((teacherId) => remote.insertAwards(awards, teacherId));

      return settled.length > 0 ? awards : [];
    },
    [commit]
  );

  useEffect(() => {
    if (!ready || settledRef.current) return;
    if (!state.settings.autoSettle) return;
    // Only the signed-in teacher settles a period; a visitor just reads it.
    if (REMOTE && !userId) return;
    if (pendingPeriods(state).length === 0) return;

    settledRef.current = true;
    const awards = closePeriods();
    const winner = awards.find((award) => award.rank === 1);
    if (winner) {
      const student = state.students.find((item) => item.id === winner.studentId);
      if (student) setCelebration({ student, stars: winner.stars, award: winner });
    }
  }, [ready, userId, state, closePeriods]);

  // ---- actions -----------------------------------------------------------
  const actions = useMemo(() => {
    const updateSettings = (patch) => {
      dispatch({ type: 'settings', patch });
      const { device, teacher } = splitSettings(patch);

      if (Object.keys(device).length > 0) {
        try {
          const stored = JSON.parse(window.localStorage.getItem(PREFS_KEY) || '{}');
          window.localStorage.setItem(PREFS_KEY, JSON.stringify({ ...stored, ...device }));
        } catch (error) {
          /* a private window simply will not remember the theme */
        }
      }

      if (REMOTE && Object.keys(teacher).length > 0) {
        const next = { ...stateRef.current.settings, ...patch };
        commit((teacherId) => saveProfileSettings(teacherId, splitSettings(next).teacher));
      }
    };

    const bulkReplace = async (nextState) => {
      const prepared = REMOTE ? remapIds(nextState) : nextState;
      dispatch({
        type: 'replace',
        state: { ...prepared, settings: stateRef.current.settings },
      });
      await commit((teacherId) => remote.replaceAll(prepared, teacherId));
      return prepared;
    };

    return {
      updateSettings,
      setTheme: (theme) => updateSettings({ theme }),
      setLocale: (locale) => updateSettings({ locale }),

      addGroup: (data) => {
        const index = stateRef.current.groups.length;
        const group = {
          id: newId(),
          name: data.name,
          subject: data.subject || '',
          emoji: data.emoji || GROUP_EMOJIS[index % GROUP_EMOJIS.length],
          color: data.color || GROUP_COLORS[index % GROUP_COLORS.length],
          createdAt: Date.now(),
        };
        dispatch({ type: 'group/add', group });
        commit((teacherId) => remote.insertGroup(group, teacherId));
      },

      updateGroup: (id, patch) => {
        dispatch({ type: 'group/update', id, patch });
        commit(() => remote.updateGroup(id, patch));
      },

      removeGroup: (id) => {
        dispatch({ type: 'group/remove', id });
        commit(() => remote.deleteGroup(id));
      },

      addStudents: (groupId, names, accent) => {
        const base = stateRef.current.students.length;
        const students = names.map((name, offset) => ({
          id: newId(),
          groupId,
          name: name.trim(),
          accent: accent || ACCENTS[(base + offset) % ACCENTS.length].key,
          createdAt: Date.now(),
        }));
        dispatch({ type: 'student/add', students });
        commit((teacherId) => remote.insertStudents(students, teacherId));
      },

      updateStudent: (id, patch) => {
        dispatch({ type: 'student/update', id, patch });
        commit(() => remote.updateStudent(id, patch));
      },

      removeStudent: (id) => {
        dispatch({ type: 'student/remove', id });
        commit(() => remote.deleteStudent(id));
      },

      addEntry: ({ studentId, groupId, value, reason, date }) => {
        const entries = [
          {
            id: newId(),
            studentId,
            groupId,
            value: clampGrade(value),
            reason: reason || '',
            date: date || todayKey(),
            createdAt: Date.now(),
          },
        ];
        dispatch({ type: 'entry/add', entries });
        commit((teacherId) => remote.insertEntries(entries, teacherId));
      },

      addBulkEntries: (studentIds, { groupId, value, reason, date }) => {
        const entries = studentIds.map((studentId) => ({
          id: newId(),
          studentId,
          groupId,
          value: clampGrade(value),
          reason: reason || '',
          date: date || todayKey(),
          createdAt: Date.now(),
        }));
        dispatch({ type: 'entry/add', entries });
        commit((teacherId) => remote.insertEntries(entries, teacherId));
      },

      removeEntry: (id) => {
        dispatch({ type: 'entry/remove', id });
        commit(() => remote.deleteEntry(id));
      },

      giveStars: ({ studentId, groupId, stars, note }) => {
        const awards = [
          {
            id: newId(),
            period: 'manual',
            periodKey: todayKey(),
            groupId,
            studentId,
            rank: 0,
            stars: Number(stars),
            points: 0,
            note: note || '',
            createdAt: Date.now(),
          },
        ];
        dispatch({ type: 'award/add', awards });
        commit((teacherId) => remote.insertAwards(awards, teacherId));
      },

      removeAward: (id) => {
        dispatch({ type: 'award/remove', id });
        commit(() => remote.deleteAward(id));
      },

      resetGrades: ({ scope, groupId }) => {
        const today = todayKey();
        const range = scope === 'all' ? null : periodRange(scope, today);

        const keep = (entry) => {
          const inGroup = !groupId || entry.groupId === groupId;
          if (!inGroup) return true;
          if (!range) return false;
          return !(entry.date >= range.from && entry.date <= range.to);
        };

        dispatch({ type: 'entry/clear', keep });
        commit((teacherId) =>
          remote.deleteEntriesIn({
            teacherId,
            groupId: groupId || null,
            from: range ? range.from : null,
            to: range ? range.to : null,
          })
        );
      },

      loadDemo: () => bulkReplace(buildDemoState()),

      wipe: () => {
        const cleared = { ...emptyState(), settings: { ...stateRef.current.settings } };
        dispatch({ type: 'replace', state: cleared });
        commit((teacherId) => remote.clearAll(teacherId));
      },

      importState: (raw) => bulkReplace(normalize(raw)),

      /** One-off move of the old browser-only data into the database. */
      importLocalState: (localState) => bulkReplace(localState),

      reload: () => (REMOTE ? refresh(userId) : Promise.resolve()),
    };
  }, [commit, refresh, userId]);

  const value = useMemo(
    () => ({
      state,
      ready,
      actions,
      toast,
      toasts,
      dismissToast,
      closePeriods,
      celebration,
      setCelebration,
      settings: state.settings,
      locale: state.settings.locale,
      theme: state.settings.theme,
      remote: REMOTE,
      userId,
      syncError,
    }),
    [
      state,
      ready,
      actions,
      toast,
      toasts,
      dismissToast,
      closePeriods,
      celebration,
      userId,
      syncError,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside <AppProvider>');
  return context;
}

export { defaultSettings };
