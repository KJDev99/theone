'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/lib/i18n';
import { computeStreak, starsForStudent } from '@/lib/calc';
import { gradeColor } from '@/lib/levels';
import { GradePill, media } from './ui';
import PersonAvatar from './PersonAvatar';
import EmptyState from './EmptyState';
import StreakBadge from './StreakBadge';
import { ClipboardIcon, StarIcon } from './Icons';

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Item = styled(motion.li)`
  position: relative;
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
  background: ${({ theme, $top }) => ($top ? theme.colors.surfaceAlt : 'transparent')};
  transition: background-color 200ms ease;

  &:hover { background: ${({ theme }) => theme.colors.surfaceAlt}; }
`;

const Fill = styled.div`
  position: absolute;
  inset: 0;
  width: ${({ $ratio }) => `${$ratio * 100}%`};
  background: ${({ theme, $color }) => `${$color || theme.colors.primary}14`};
  transition: width 700ms ${({ theme }) => theme.ease.out};
`;

const Inner = styled(Link)`
  position: relative;
  display: grid;
  grid-template-columns: 34px auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 10px 14px 10px 8px;

  ${media.sm`
    grid-template-columns: 28px auto 1fr auto;
    gap: 9px;
    padding: 9px 10px 9px 4px;
  `}
`;

const Rank = styled.span`
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $medal }) => ($medal ? '#2a1c00' : theme.colors.textFaint)};
  background: ${({ theme, $medal }) => $medal || 'transparent'};

  ${media.sm`width: 26px; height: 26px; font-size: 12px;`}
`;

const Meta = styled.div`
  min-width: 0;

  .name {
    font-size: 14px;
    font-weight: 650;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sub {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: 3px;
    font-size: 11.5px;
    color: ${({ theme }) => theme.colors.textFaint};
  }
`;

const Points = styled.div`
  text-align: right;

  .value {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
    color: ${({ theme, $zero }) => ($zero ? theme.colors.textFaint : theme.colors.text)};
  }

  .unit {
    font-size: 10.5px;
    color: ${({ theme }) => theme.colors.textFaint};
    text-transform: lowercase;
  }
`;

const StarCount = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: ${({ theme }) => theme.colors.star};
  font-weight: 700;
`;

const MEDALS = { 1: '#F5C451', 2: '#C8D2DE', 3: '#D89A67' };

export default function RankList({ rows, color, showStreak = true, limit }) {
  const { state, settings } = useApp();
  const { t } = useI18n();
  const visible = limit ? rows.slice(0, limit) : rows;
  const tone = { passMark: settings.passMark, excellentMark: settings.excellentMark };

  if (visible.length === 0) {
    return <EmptyState icon={ClipboardIcon} title={t('leaderboard.noData')} />;
  }

  return (
    <List>
      {visible.map((row, index) => {
        const streak = showStreak
          ? computeStreak(state.entries, row.student.id, {
              skipWeekends: settings.skipWeekends,
              passMark: settings.passMark,
            }).current
          : 0;
        const accent = gradeColor(row.average, tone);
        const stars = starsForStudent(state.awards, row.student.id);

        return (
          <Item
            key={row.student.id}
            $top={row.rank <= 3 && row.graded}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.03, 0.35), duration: 0.32 }}
          >
            {row.graded && <Fill $ratio={row.average / 100} $color={color || accent} />}
            <Inner href={`/students/${row.student.id}`}>
              <Rank $medal={row.graded ? MEDALS[row.rank] : null}>{row.rank}</Rank>
              <PersonAvatar student={row.student} size={34} />
              <Meta>
                <div className="name">{row.student.name}</div>
                <div className="sub">
                  <span>
                    {row.count} {t('common.grades')}
                  </span>
                  {stars > 0 && (
                    <StarCount>
                      <StarIcon size={11} filled />
                      {stars}
                    </StarCount>
                  )}
                  {streak > 0 && (
                    <StreakBadge count={streak} goal={settings.streakGoal} size="sm" />
                  )}
                </div>
              </Meta>
              <Points>
                {row.graded ? (
                  <GradePill $color={accent}>{row.average}</GradePill>
                ) : (
                  <div className="unit">{t('common.none')}</div>
                )}
              </Points>
            </Inner>
          </Item>
        );
      })}
    </List>
  );
}
