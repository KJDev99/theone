import {
  buildLeaderboard,
  computeStreak,
  entriesForPeriod,
  rankMovement,
  starsForStudent,
  trophiesForStudent,
  round1,
} from './calc';
import { daysBetween, isWeekend, periodRange, todayKey } from './dates';

/**
 * Badges a student keeps on their card. They are recomputed from the marks
 * rather than stored, so nothing can drift out of sync with the grade book.
 */
export const BADGES = {
  champion: { icon: 'trophy', color: '#F0B429' },
  topNow: { icon: 'crown', color: '#8A5BF0' },
  streak: { icon: 'flame', color: '#FF7A45' },
  perfectWeek: { icon: 'target', color: '#12A87A' },
  climber: { icon: 'rocket', color: '#3B82F6' },
  starCollector: { icon: 'star', color: '#F2547D' },
  perfectScore: { icon: 'zap', color: '#0FA3C7' },
  spotless: { icon: 'shield', color: '#12A87A' },
  honours: { icon: 'gem', color: '#8A5BF0' },
};

export function achievementsFor(state, studentId, options = {}) {
  const {
    today = todayKey(),
    skipWeekends = true,
    streakGoal = 5,
    passMark = 60,
    excellentMark = 86,
  } = options;
  const student = state.students.find((item) => item.id === studentId);
  if (!student) return [];

  const own = state.entries.filter((entry) => entry.studentId === studentId);
  const earned = [];

  if (trophiesForStudent(state.awards, studentId) > 0) earned.push('champion');

  const board = buildLeaderboard({
    students: state.students,
    entries: state.entries,
    groupId: student.groupId,
    period: 'week',
    anchor: today,
    passMark,
  });
  const row = board.find((item) => item.student.id === studentId);
  if (row && row.rank === 1 && row.graded) earned.push('topNow');

  const streak = computeStreak(state.entries, studentId, {
    skipWeekends,
    today,
    passMark,
  });
  if (streak.current >= streakGoal) earned.push('streak');

  // Every school day of the current week so far carries a mark.
  const { from } = periodRange('week', today);
  const schoolDays = daysBetween(from, today).filter(
    (day) => !(skipWeekends && isWeekend(day))
  );
  const gradedDays = new Set(own.map((entry) => entry.date));
  if (schoolDays.length >= 3 && schoolDays.every((day) => gradedDays.has(day))) {
    earned.push('perfectWeek');
  }

  const movement = rankMovement({
    students: state.students,
    entries: state.entries,
    groupId: student.groupId,
    period: 'week',
    anchor: today,
    passMark,
  }).get(studentId);
  if (movement && !movement.isNew && movement.delta >= 3) earned.push('climber');

  if (starsForStudent(state.awards, studentId) >= 10) earned.push('starCollector');

  if (own.some((entry) => entry.value >= 100)) earned.push('perfectScore');

  // Ten marks deep and not one of them below the pass mark.
  if (own.length >= 10 && own.every((entry) => entry.value >= passMark)) {
    earned.push('spotless');
  }

  const monthMarks = entriesForPeriod(own, 'month', today);
  if (monthMarks.length >= 5) {
    const monthAverage = round1(
      monthMarks.reduce((total, entry) => total + entry.value, 0) / monthMarks.length
    );
    if (monthAverage >= excellentMark) earned.push('honours');
  }

  return earned.map((key) => ({ key, ...BADGES[key] }));
}
