import { GROUP_COLORS, GROUP_EMOJIS, clampGrade, defaultSettings, uid } from './model';
import { ACCENTS } from './identity';
import { addDays, isWeekend, todayKey } from './dates';

const GROUPS = [
  { name: 'English A1 — Morning', subject: 'English', emoji: '📘', color: GROUP_COLORS[0] },
  { name: 'Math Olympiad', subject: 'Mathematics', emoji: '🧮', color: GROUP_COLORS[2] },
  { name: 'IT Beginners', subject: 'Computer Science', emoji: '💻', color: GROUP_COLORS[4] },
];

const NAMES = [
  [
    'Aziza Karimova',
    "O'ktam Yo'ldoshev",
    'Dilnoza Rashidova',
    'Jasur Ochilov',
    'Malika Yusupova',
    'Sardor Nazarov',
    'Zilola Ergasheva',
    'Otabek Sobirov',
  ],
  [
    'Nodira Islomova',
    "G'ulom Sa'dullayev",
    'Kamola Tosheva',
    'Ulugbek Aliyev',
    'Sevara Xolmatova',
    'Islom Rahimov',
  ],
  [
    'Gulnora Sattorova',
    'Doniyor Umarov',
    "Feruza Sa'dieva",
    'Javohir Mirzayev',
    'Nigora Abdullayeva',
  ],
];

const REASONS = [
  'Homework',
  'Active in class',
  'Perfect test',
  'Helped a classmate',
  'Reading task',
  'Project work',
];

// A tiny seeded generator keeps the demo class identical between reloads.
function seeded(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

export function buildDemoState() {
  const random = seeded(20240917);
  const today = todayKey();
  const groups = [];
  const students = [];
  const entries = [];

  GROUPS.forEach((definition, groupIndex) => {
    const group = {
      id: uid('grp'),
      ...definition,
      emoji: definition.emoji || GROUP_EMOJIS[groupIndex],
      createdAt: Date.now() - (groupIndex + 1) * 86400000 * 40,
    };
    groups.push(group);

    NAMES[groupIndex].forEach((name, studentIndex) => {
      const student = {
        id: uid('std'),
        groupId: group.id,
        name,
        accent: ACCENTS[(groupIndex * 5 + studentIndex) % ACCENTS.length].key,
        createdAt: group.createdAt + 3600000,
      };
      students.push(student);

      // Each student gets a personality: how often they are graded and roughly
      // where their marks land on the hundred-point scale.
      const diligence = 0.35 + random() * 0.6;
      const level = 58 + random() * 36;

      for (let back = 38; back >= 0; back -= 1) {
        const date = addDays(today, -back);
        if (isWeekend(date)) continue;
        if (random() > diligence) continue;
        // A little spread around the student's usual standard.
        const value = clampGrade(level + (random() - 0.5) * 22);
        entries.push({
          id: uid('ent'),
          studentId: student.id,
          groupId: group.id,
          value,
          reason: REASONS[Math.floor(random() * REASONS.length)],
          date,
          createdAt: Date.now() - back * 86400000,
        });
        // Now and then a second mark on the same day, often a weaker one.
        if (random() > 0.9) {
          entries.push({
            id: uid('ent'),
            studentId: student.id,
            groupId: group.id,
            value: clampGrade(level - 25 + random() * 30),
            reason: 'Missed homework',
            date,
            createdAt: Date.now() - back * 86400000 + 1000,
          });
        }
      }
    });
  });

  return {
    version: 2,
    groups,
    students,
    entries,
    awards: [],
    settings: { ...defaultSettings, teacherName: 'Ms. Nilufar' },
  };
}
