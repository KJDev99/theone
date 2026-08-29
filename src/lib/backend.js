'use client';

import { getSupabase, PUBLIC_TEACHER_ID, isSupabaseConfigured } from './supabase';

/**
 * The bridge between the app's camelCase objects and the snake_case rows in
 * Postgres. Every function here is a thin, single-purpose call so the context
 * above it can stay readable.
 */

const PAGE = 1000; // PostgREST caps a response at 1000 rows by default.

export function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // Fallback for older browsers: RFC-4122-shaped, good enough as a primary key.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/** Reads a whole table in 1000-row pages so a long school year is never truncated. */
async function fetchAll(table, scope, order = 'created_at') {
  const supabase = getSupabase();
  const rows = [];
  let page = 0;

  for (;;) {
    let query = supabase
      .from(table)
      .select('*')
      .order(order, { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1);

    if (scope) query = query.eq('teacher_id', scope);

    const { data, error } = await query;
    if (error) throw error;

    rows.push(...data);
    if (data.length < PAGE) return rows;
    page += 1;
  }
}

// ---- row mappers -----------------------------------------------------------

const toTime = (value) => (value ? Date.parse(value) : Date.now());

export const mapGroup = (row) => ({
  id: row.id,
  name: row.name,
  subject: row.subject || '',
  emoji: row.emoji || '',
  color: row.color,
  createdAt: toTime(row.created_at),
});

export const mapStudent = (row) => ({
  id: row.id,
  groupId: row.group_id,
  name: row.name,
  accent: row.accent || null,
  createdAt: toTime(row.created_at),
});

export const mapEntry = (row) => ({
  id: row.id,
  groupId: row.group_id,
  studentId: row.student_id,
  value: row.value,
  reason: row.reason || '',
  date: row.date,
  createdAt: toTime(row.created_at),
});

export const mapAward = (row) => ({
  id: row.id,
  groupId: row.group_id,
  studentId: row.student_id,
  period: row.period,
  periodKey: row.period_key,
  rank: row.rank,
  stars: row.stars,
  points: row.points,
  note: row.note || '',
  createdAt: toTime(row.created_at),
});

const groupRow = (group, teacherId) => ({
  id: group.id,
  teacher_id: teacherId,
  name: group.name,
  subject: group.subject || '',
  emoji: group.emoji || '',
  color: group.color,
});

const studentRow = (student, teacherId) => ({
  id: student.id,
  teacher_id: teacherId,
  group_id: student.groupId,
  name: student.name,
  accent: student.accent || null,
});

const entryRow = (entry, teacherId) => ({
  id: entry.id,
  teacher_id: teacherId,
  group_id: entry.groupId,
  student_id: entry.studentId,
  value: entry.value,
  reason: entry.reason || '',
  date: entry.date,
});

const awardRow = (award, teacherId) => ({
  id: award.id,
  teacher_id: teacherId,
  group_id: award.groupId,
  student_id: award.studentId || null,
  period: award.period,
  period_key: award.periodKey,
  rank: award.rank || 0,
  stars: award.stars || 0,
  points: award.points || 0,
  note: award.note || '',
});

export const rowBuilders = { groupRow, studentRow, entryRow, awardRow };

// ---- reads -----------------------------------------------------------------

/**
 * Everything the app needs, in one round trip of four parallel queries.
 * `viewerId` is the signed-in teacher; when nobody is signed in the public
 * scope (or the whole project) is read instead.
 */
export async function loadRemoteState(viewerId = null) {
  const scope = viewerId || PUBLIC_TEACHER_ID;

  const [groups, students, entries, awards] = await Promise.all([
    fetchAll('groups', scope),
    fetchAll('students', scope),
    fetchAll('entries', scope, 'date'),
    fetchAll('awards', scope),
  ]);

  return {
    groups: groups.map(mapGroup),
    students: students.map(mapStudent),
    entries: entries.map(mapEntry),
    awards: awards.map(mapAward),
  };
}

/**
 * The single account allowed to write, or null while the seat is unclaimed.
 * Returns undefined when the question cannot be answered — an older project
 * that has not run the single-teacher SQL yet, or a network hiccup — so the
 * caller can tell "not the teacher" apart from "do not know".
 */
export async function fetchOwnerId() {
  const { data, error } = await getSupabase()
    .from('app_owner')
    .select('user_id')
    .limit(1)
    .maybeSingle();
  if (error) return undefined;
  return data ? data.user_id : null;
}

export async function loadProfileSettings(teacherId) {
  if (!teacherId) return null;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, settings')
    .eq('id', teacherId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return { displayName: data.display_name || '', settings: data.settings || {} };
}

export async function saveProfileSettings(teacherId, settings) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('profiles')
    .upsert(
      { id: teacherId, settings, display_name: settings.teacherName || null },
      { onConflict: 'id' }
    );
  if (error) throw error;
}

// ---- writes ----------------------------------------------------------------

const run = async (query) => {
  const { error } = await query;
  if (error) throw error;
};

export const remote = {
  insertGroup: (group, teacherId) =>
    run(getSupabase().from('groups').insert(groupRow(group, teacherId))),

  updateGroup: (id, patch) =>
    run(
      getSupabase()
        .from('groups')
        .update({
          ...(patch.name !== undefined && { name: patch.name }),
          ...(patch.subject !== undefined && { subject: patch.subject }),
          ...(patch.emoji !== undefined && { emoji: patch.emoji }),
          ...(patch.color !== undefined && { color: patch.color }),
        })
        .eq('id', id)
    ),

  deleteGroup: (id) => run(getSupabase().from('groups').delete().eq('id', id)),

  insertStudents: (students, teacherId) =>
    run(getSupabase().from('students').insert(students.map((s) => studentRow(s, teacherId)))),

  updateStudent: (id, patch) =>
    run(
      getSupabase()
        .from('students')
        .update({
          ...(patch.name !== undefined && { name: patch.name }),
          ...(patch.accent !== undefined && { accent: patch.accent }),
        })
        .eq('id', id)
    ),

  deleteStudent: (id) => run(getSupabase().from('students').delete().eq('id', id)),

  insertEntries: (entries, teacherId) =>
    run(getSupabase().from('entries').insert(entries.map((e) => entryRow(e, teacherId)))),

  deleteEntry: (id) => run(getSupabase().from('entries').delete().eq('id', id)),

  /** Used by "reset points": one statement instead of a delete per row. */
  deleteEntriesIn: async ({ teacherId, groupId, from, to }) => {
    let query = getSupabase().from('entries').delete().eq('teacher_id', teacherId);
    if (groupId) query = query.eq('group_id', groupId);
    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);
    await run(query);
  },

  /**
   * Award inserts are allowed to collide: two devices can try to settle the
   * same finished week at once, and the unique index in the schema stops the
   * second one. A collision is success, not an error.
   */
  insertAwards: async (awards, teacherId) => {
    const { error } = await getSupabase()
      .from('awards')
      .insert(awards.map((a) => awardRow(a, teacherId)));
    if (error && error.code !== '23505') throw error;
    return error ? 'duplicate' : 'inserted';
  },

  deleteAward: (id) => run(getSupabase().from('awards').delete().eq('id', id)),

  /** Wipes the teacher's own data. Groups cascade to students, entries, awards. */
  clearAll: async (teacherId) => {
    await run(getSupabase().from('awards').delete().eq('teacher_id', teacherId));
    await run(getSupabase().from('entries').delete().eq('teacher_id', teacherId));
    await run(getSupabase().from('students').delete().eq('teacher_id', teacherId));
    await run(getSupabase().from('groups').delete().eq('teacher_id', teacherId));
  },

  /**
   * Bulk load used by "import backup", "load demo data" and the one-off
   * migration of the old browser-only data. Inserted parent-first so the
   * foreign keys always resolve, and chunked to stay inside request limits.
   */
  replaceAll: async (state, teacherId) => {
    await remote.clearAll(teacherId);
    const chunk = async (table, rows, build) => {
      for (let i = 0; i < rows.length; i += 500) {
        await run(
          getSupabase()
            .from(table)
            .insert(rows.slice(i, i + 500).map((row) => build(row, teacherId)))
        );
      }
    };
    await chunk('groups', state.groups, groupRow);
    await chunk('students', state.students, studentRow);
    await chunk('entries', state.entries, entryRow);
    await chunk('awards', state.awards.filter((a) => a.studentId || a.period !== 'manual'), awardRow);
  },
};

/**
 * Calls `onChange` whenever any of the four tables changes, from any device.
 * Returns an unsubscribe function.
 */
export function subscribeToChanges(onChange) {
  if (!isSupabaseConfigured()) return () => {};
  const supabase = getSupabase();

  const channel = supabase.channel('ball-system-changes');
  ['groups', 'students', 'entries', 'awards'].forEach((table) => {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, onChange);
  });
  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
