import {
  addDays,
  daysBetween,
  isWeekend,
  monthKey,
  periodKeyOf,
  periodRange,
  shiftPeriod,
  todayKey,
  weekKey,
} from './dates';

/** One decimal place is as precise as a class average ever needs to be. */
export function round1(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

export function sumOf(entries) {
  return entries.reduce((total, entry) => total + entry.value, 0);
}

/** Mean mark of a list of entries, on the 0-100 scale. */
export function averageOf(entries) {
  if (!entries.length) return 0;
  return round1(sumOf(entries) / entries.length);
}

export function entriesInRange(entries, from, to) {
  return entries.filter((entry) => entry.date >= from && entry.date <= to);
}

export function entriesForPeriod(entries, period, anchor = todayKey()) {
  if (period === 'all') return entries;
  const { from, to } = periodRange(period, anchor);
  return entriesInRange(entries, from, to);
}

/**
 * Ranked standings for one group (or every group when groupId is null).
 *
 * Students are ordered by their average mark, not by how many marks they
 * collected — otherwise simply being present more often would outrank doing
 * better work. The number of marks is the tie-break, so between two students
 * averaging 92 the one who earned it over more lessons comes first.
 *
 * Ties share a rank: two students on 92.0 are both 1st and the next is 3rd,
 * the same way a teacher would read it out loud.
 */
export function buildLeaderboard({
  students,
  entries,
  groupId = null,
  period = 'week',
  anchor = todayKey(),
  passMark = 60,
}) {
  const pool = groupId
    ? students.filter((student) => student.groupId === groupId)
    : students;
  const scoped = entriesForPeriod(
    groupId ? entries.filter((entry) => entry.groupId === groupId) : entries,
    period,
    anchor
  );

  const byStudent = new Map();
  scoped.forEach((entry) => {
    const bucket = byStudent.get(entry.studentId) || {
      sum: 0,
      count: 0,
      days: new Set(),
      best: 0,
      worst: 100,
      passed: 0,
      failed: 0,
    };
    bucket.sum += entry.value;
    bucket.count += 1;
    bucket.days.add(entry.date);
    bucket.best = Math.max(bucket.best, entry.value);
    bucket.worst = Math.min(bucket.worst, entry.value);
    if (entry.value >= passMark) bucket.passed += 1;
    else bucket.failed += 1;
    byStudent.set(entry.studentId, bucket);
  });

  const rows = pool.map((student) => {
    const bucket = byStudent.get(student.id);
    if (!bucket) {
      return {
        student,
        average: 0,
        count: 0,
        sum: 0,
        best: 0,
        worst: 0,
        activeDays: 0,
        passed: 0,
        failed: 0,
        graded: false,
      };
    }
    return {
      student,
      average: round1(bucket.sum / bucket.count),
      count: bucket.count,
      sum: bucket.sum,
      best: bucket.best,
      worst: bucket.worst,
      activeDays: bucket.days.size,
      passed: bucket.passed,
      failed: bucket.failed,
      graded: true,
    };
  });

  rows.sort((a, b) => {
    if (b.average !== a.average) return b.average - a.average;
    if (b.count !== a.count) return b.count - a.count;
    return a.student.name.localeCompare(b.student.name);
  });

  let lastAverage = null;
  let lastRank = 0;
  rows.forEach((row, index) => {
    if (row.average !== lastAverage) {
      lastRank = index + 1;
      lastAverage = row.average;
    }
    row.rank = lastRank;
  });

  return rows;
}

function bestStreak(goodDays, skipWeekends) {
  const sorted = [...goodDays].sort();
  if (sorted.length === 0) return 0;
  let best = 0;
  let run = 0;
  let previous = null;
  sorted.forEach((day) => {
    if (previous === null) {
      run = 1;
    } else {
      let gapDay = addDays(previous, 1);
      let contiguous = true;
      let guard = 0;
      while (gapDay < day && guard < 20) {
        if (!(skipWeekends && isWeekend(gapDay))) {
          contiguous = false;
          break;
        }
        gapDay = addDays(gapDay, 1);
        guard += 1;
      }
      run = contiguous ? run + 1 : 1;
    }
    previous = day;
    best = Math.max(best, run);
  });
  return best;
}

/**
 * The days a student's marks averaged a pass. A single weak mark does not end
 * a streak on its own — the day as a whole has to fall below the pass mark.
 */
export function passingDays(entries, studentId, passMark = 60) {
  const perDay = new Map();
  entries.forEach((entry) => {
    if (entry.studentId !== studentId) return;
    const bucket = perDay.get(entry.date) || { sum: 0, count: 0 };
    bucket.sum += entry.value;
    bucket.count += 1;
    perDay.set(entry.date, bucket);
  });

  const days = new Set();
  perDay.forEach((bucket, date) => {
    if (bucket.sum / bucket.count >= passMark) days.add(date);
  });
  return days;
}

/**
 * Consecutive passing days counting back from today. School weekends are
 * skipped rather than treated as a miss when the setting is on.
 */
export function computeStreak(entries, studentId, options = {}) {
  const { skipWeekends = true, today = todayKey(), passMark = 60 } = options;
  const goodDays = passingDays(entries, studentId, passMark);
  if (goodDays.size === 0) return { current: 0, best: 0, lastDay: null };

  // Days that carry a mark at all, passing or not. A day that was graded and
  // failed ends the streak outright; only an ungraded day is forgiven.
  const gradedDays = new Set(
    entries.filter((entry) => entry.studentId === studentId).map((entry) => entry.date)
  );

  let cursor = today;
  if (skipWeekends) {
    while (isWeekend(cursor) && !goodDays.has(cursor)) {
      cursor = addDays(cursor, -1);
    }
  }

  // A streak survives until the end of the next school day, so yesterday still
  // counts while today's marks have not been entered yet — but not once today
  // has a mark of its own that fell short.
  if (!goodDays.has(cursor)) {
    if (gradedDays.has(cursor)) {
      return { current: 0, best: bestStreak(goodDays, skipWeekends), lastDay: null };
    }
    let previous = addDays(cursor, -1);
    if (skipWeekends) {
      while (isWeekend(previous) && !goodDays.has(previous)) {
        previous = addDays(previous, -1);
      }
    }
    if (!goodDays.has(previous)) {
      return { current: 0, best: bestStreak(goodDays, skipWeekends), lastDay: null };
    }
    cursor = previous;
  }

  let current = 0;
  let lastDay = cursor;
  let guard = 0;
  while (guard < 400) {
    if (goodDays.has(cursor)) {
      current += 1;
      lastDay = cursor;
      cursor = addDays(cursor, -1);
    } else if (skipWeekends && isWeekend(cursor)) {
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
    guard += 1;
  }

  return {
    current,
    best: Math.max(current, bestStreak(goodDays, skipWeekends)),
    lastDay,
  };
}

export function starsForStudent(awards, studentId) {
  return awards
    .filter((award) => award.studentId === studentId)
    .reduce((total, award) => total + award.stars, 0);
}

export function trophiesForStudent(awards, studentId) {
  return awards.filter(
    (award) =>
      award.studentId === studentId && award.rank === 1 && award.period !== 'manual'
  ).length;
}

/**
 * Which past week/month periods have finished but were never settled.
 * Oldest first, so they can be closed in chronological order.
 */
export function pendingPeriods(state, today = todayKey()) {
  const { entries, groups, awards } = state;
  if (entries.length === 0) return [];
  const settled = new Set(
    awards.map((award) => `${award.period}:${award.periodKey}:${award.groupId}`)
  );
  const currentWeek = weekKey(today);
  const currentMonth = monthKey(today);
  const pending = [];

  groups.forEach((group) => {
    const groupEntries = entries.filter((entry) => entry.groupId === group.id);
    if (groupEntries.length === 0) return;
    ['week', 'month'].forEach((period) => {
      const currentKey = period === 'week' ? currentWeek : currentMonth;
      const seen = new Map();
      groupEntries.forEach((entry) => {
        const key = periodKeyOf(period, entry.date);
        if (!seen.has(key)) seen.set(key, entry.date);
      });
      seen.forEach((anchorDate, key) => {
        if (key >= currentKey) return;
        if (settled.has(`${period}:${key}:${group.id}`)) return;
        pending.push({ period, periodKey: key, groupId: group.id, anchor: anchorDate });
      });
    });
  });

  pending.sort((a, b) => a.periodKey.localeCompare(b.periodKey));
  return pending;
}

/** Build the award records for one finished period. */
export function settlePeriod(state, { period, periodKey, groupId, anchor }) {
  const passMark = state.settings.passMark;
  const rows = buildLeaderboard({
    students: state.students,
    entries: state.entries,
    groupId,
    period,
    anchor,
    passMark,
  }).filter((row) => row.graded);

  const table = state.settings.awardStars[period] || [3, 2, 1];
  return rows
    .filter((row) => row.rank <= table.length)
    .map((row) => ({
      period,
      periodKey,
      groupId,
      studentId: row.student.id,
      rank: row.rank,
      stars: table[row.rank - 1] || 0,
      points: Math.round(row.average),
      createdAt: Date.now(),
    }));
}

/**
 * The average mark per day across a range — powers the sparkline charts.
 * Days without a mark report `count: 0` so a chart can draw a gap rather than
 * pretending the student scored a zero.
 */
export function dailySeries(entries, from, to, studentId = null) {
  const scoped = studentId
    ? entries.filter((entry) => entry.studentId === studentId)
    : entries;
  const totals = new Map();
  scoped.forEach((entry) => {
    if (entry.date < from || entry.date > to) return;
    const bucket = totals.get(entry.date) || { sum: 0, count: 0 };
    bucket.sum += entry.value;
    bucket.count += 1;
    totals.set(entry.date, bucket);
  });
  return daysBetween(from, to).map((date) => {
    const bucket = totals.get(date);
    return {
      date,
      value: bucket ? round1(bucket.sum / bucket.count) : 0,
      count: bucket ? bucket.count : 0,
    };
  });
}

export function groupSummary(state, groupId, period = 'week', anchor = todayKey()) {
  const passMark = state.settings.passMark;
  const rows = buildLeaderboard({
    students: state.students,
    entries: state.entries,
    groupId,
    period,
    anchor,
    passMark,
  });
  const graded = rows.filter((row) => row.graded);
  const marks = graded.reduce((total, row) => total + row.count, 0);
  const average = marks
    ? round1(graded.reduce((total, row) => total + row.sum, 0) / marks)
    : 0;

  return {
    rows,
    average,
    marks,
    active: graded.length,
    size: rows.length,
    leader: graded[0] || null,
    passRate: marks
      ? round1((graded.reduce((total, row) => total + row.passed, 0) / marks) * 100)
      : 0,
  };
}

/**
 * How far each student moved since the previous week/month. A student who was
 * not graded at all last period is reported as `new` rather than as a huge
 * climb, which would otherwise flatter everyone in their first week.
 */
export function rankMovement({
  students,
  entries,
  groupId = null,
  period = 'week',
  anchor = todayKey(),
  passMark = 60,
}) {
  const current = buildLeaderboard({
    students,
    entries,
    groupId,
    period,
    anchor,
    passMark,
  });
  const previous = buildLeaderboard({
    students,
    entries,
    groupId,
    period,
    anchor: shiftPeriod(period, anchor, -1),
    passMark,
  });

  const graded = previous.filter((row) => row.graded);
  const before = new Map(graded.map((row) => [row.student.id, row.rank]));
  const beforeAverage = new Map(graded.map((row) => [row.student.id, row.average]));

  const movement = new Map();
  current.forEach((row) => {
    if (!row.graded) {
      movement.set(row.student.id, { delta: 0, gain: 0, isNew: false, unranked: true });
      return;
    }
    const prior = before.get(row.student.id);
    movement.set(row.student.id, {
      delta: prior === undefined ? 0 : prior - row.rank,
      gain:
        prior === undefined
          ? 0
          : round1(row.average - (beforeAverage.get(row.student.id) || 0)),
      isNew: prior === undefined,
      unranked: false,
    });
  });

  return movement;
}
