'use client';

import { STORAGE_KEY, normalize } from './model';
import { newId } from './backend';

/**
 * Reads whatever the browser-only version of the app left behind, so a teacher
 * who has been using it for a term does not lose that term when they move to
 * Supabase.
 */
export function readLocalState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = normalize(JSON.parse(raw));
    if (state.groups.length === 0 && state.students.length === 0) return null;
    return state;
  } catch (error) {
    return null;
  }
}

export function hasLocalState() {
  return readLocalState() !== null;
}

/**
 * Postgres primary keys are uuids; the browser-only version used ids like
 * `grp_a1b2c3`. This rewrites every id to a uuid and repoints all the
 * relationships at the new ones, so an old backup can be inserted as-is.
 */
export function remapIds(state) {
  const groupIds = new Map();
  const studentIds = new Map();

  const groups = state.groups.map((group) => {
    const id = newId();
    groupIds.set(group.id, id);
    return { ...group, id };
  });

  const students = state.students.map((student) => {
    const id = newId();
    studentIds.set(student.id, id);
    return { ...student, id, groupId: groupIds.get(student.groupId) };
  });

  const entries = state.entries
    .map((entry) => ({
      ...entry,
      id: newId(),
      groupId: groupIds.get(entry.groupId),
      studentId: studentIds.get(entry.studentId),
    }))
    .filter((entry) => entry.groupId && entry.studentId);

  const awards = state.awards
    .map((award) => ({
      ...award,
      id: newId(),
      groupId: award.groupId ? groupIds.get(award.groupId) : null,
      studentId: award.studentId ? studentIds.get(award.studentId) : null,
    }))
    .filter((award) => award.groupId);

  return { ...state, groups, students, entries, awards };
}

/** Drops the local copy once it has been safely moved into the database. */
export function clearLocalState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    /* nothing to clear */
  }
}
