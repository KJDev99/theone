'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/lib/i18n';
import { averageOf, buildLeaderboard, computeStreak, starsForStudent } from '@/lib/calc';
import { gradeColor } from '@/lib/levels';
import { todayKey } from '@/lib/dates';
import LevelBadge from './LevelBadge';
import StreakBadge from './StreakBadge';
import { GradePill, Muted, media } from './ui';
import { SearchField } from './Fields';
import PersonAvatar from './PersonAvatar';
import { ChevronRightIcon, StarIcon } from './Icons';

const Results = styled(motion.ul)`
  display: grid;
  gap: 8px;
  margin-top: 14px;
`;

const Hit = styled(motion.li)`
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  transition: border-color 170ms ease, transform 170ms ${({ theme }) => theme.ease.out};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
  }
`;

const HitLink = styled(Link)`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 13px;
  padding: 12px 14px;

  .who {
    min-width: 0;
  }

  .name {
    font-size: 14.5px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 5px;
    font-size: 11.5px;
    color: ${({ theme }) => theme.colors.textFaint};
    flex-wrap: wrap;
  }

  .score {
    text-align: right;
    display: grid;
    gap: 4px;
    justify-items: end;

    span {
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: ${({ theme }) => theme.colors.textFaint};
      font-weight: 700;
    }
  }

  .chev {
    color: ${({ theme }) => theme.colors.textFaint};
  }

  ${media.sm`
    grid-template-columns: auto minmax(0, 1fr) auto;
    .chev { display: none; }
  `}
`;

const Stars = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: ${({ theme }) => theme.colors.star};
  font-weight: 700;
`;

/** "Find your name" — the entry point for a student or parent on the public side. */
export default function StudentFinder({ limit = 6 }) {
  const { state, settings } = useApp();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const today = todayKey();
  const tone = { passMark: settings.passMark, excellentMark: settings.excellentMark };

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 1) return [];
    return state.students
      .filter((student) => student.name.toLowerCase().includes(needle))
      .slice(0, limit)
      .map((student) => {
        const group = state.groups.find((item) => item.id === student.groupId);
        const inGroup = buildLeaderboard({
          students: state.students,
          entries: state.entries,
          groupId: student.groupId,
          period: 'week',
          anchor: today,
          passMark: settings.passMark,
        }).find((row) => row.student.id === student.id);
        return {
          student,
          group,
          rank: inGroup && inGroup.graded ? inGroup.rank : null,
          size: state.students.filter((item) => item.groupId === student.groupId).length,
          average: inGroup ? inGroup.average : 0,
          overall: averageOf(
            state.entries.filter((entry) => entry.studentId === student.id)
          ),
          stars: starsForStudent(state.awards, student.id),
          streak: computeStreak(state.entries, student.id, {
            skipWeekends: settings.skipWeekends,
            passMark: settings.passMark,
          }).current,
        };
      });
  }, [query, state, settings.skipWeekends, settings.passMark, today, limit]);

  return (
    <div>
      <SearchField
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
        placeholder={t('public.searchPlaceholder')}
        aria-label={t('public.findYou')}
      />

      <AnimatePresence mode="wait">
        {query.trim().length === 0 ? (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Muted $size="12.5px" style={{ marginTop: 11 }}>
              {t('public.startTyping')}
            </Muted>
          </motion.div>
        ) : matches.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Muted $size="12.5px" style={{ marginTop: 11 }}>
              {t('public.noMatches')}
            </Muted>
          </motion.div>
        ) : (
          <Results key="hits" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {matches.map((hit, index) => (
              <Hit
                key={hit.student.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.28 }}
              >
                <HitLink href={`/students/${hit.student.id}`}>
                  <PersonAvatar student={hit.student} size={44} glow />
                  <span className="who">
                    <span className="name">{hit.student.name}</span>
                    <span className="meta">
                      {hit.group && <span>{hit.group.name}</span>}
                      <LevelBadge average={hit.overall} size="sm" />
                      {hit.streak > 0 && (
                        <StreakBadge count={hit.streak} goal={settings.streakGoal} size="sm" />
                      )}
                      {hit.stars > 0 && (
                        <Stars>
                          <StarIcon size={11} filled />
                          {hit.stars}
                        </Stars>
                      )}
                    </span>
                  </span>
                  <span className="score">
                    <GradePill $color={gradeColor(hit.average, tone)}>
                      {hit.average || '—'}
                    </GradePill>
                    <span>
                      {hit.rank ? `#${hit.rank} / ${hit.size}` : t('common.week')}
                    </span>
                  </span>
                  <ChevronRightIcon size={18} className="chev" />
                </HitLink>
              </Hit>
            ))}
          </Results>
        )}
      </AnimatePresence>
    </div>
  );
}
