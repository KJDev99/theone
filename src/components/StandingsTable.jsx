'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/lib/i18n';
import { averageOf, computeStreak, rankMovement, starsForStudent } from '@/lib/calc';
import { todayKey } from '@/lib/dates';
import { gradeColor, gradeTone, levelFor } from '@/lib/levels';
import PersonAvatar from './PersonAvatar';
import EmptyState from './EmptyState';
import { GradePill, media } from './ui';
import {
  ClipboardIcon,
  FlameIcon,
  StarIcon,
  TrendDownIcon,
  TrendUpIcon,
} from './Icons';

const Scroll = styled.div`
  overflow-x: auto;
  margin: 0 -6px;
  padding: 0 6px;

  &::-webkit-scrollbar {
    height: 6px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 4px;
  font-variant-numeric: tabular-nums;
  min-width: 760px;

  thead th {
    text-align: right;
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.textFaint};
    padding: 0 10px 8px;
    white-space: nowrap;
  }

  thead th:first-child,
  thead th:nth-child(2) {
    text-align: left;
  }

  tbody td {
    padding: 0 10px;
    height: 56px;
    text-align: right;
    white-space: nowrap;
    background: ${({ theme }) => theme.colors.surfaceAlt};
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }

  tbody td:first-child {
    text-align: left;
    border-left: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 14px 0 0 14px;
    padding-left: 12px;
  }

  tbody td:nth-child(2) {
    text-align: left;
  }

  tbody td:last-child {
    border-right: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0 14px 14px 0;
  }

  ${media.sm`
    min-width: 680px;
    tbody td { height: 52px; padding: 0 7px; }
    thead th { padding: 0 7px 8px; }
  `}
`;

const Row = styled(motion.tr)`
  td {
    transition: background-color 160ms ease, border-color 160ms ease;
  }

  &:hover td {
    background: ${({ theme }) => theme.colors.surface};
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }

  ${({ $podium, $accent }) =>
    $podium &&
    `
    td { border-color: ${$accent}44; }
    td:first-child { box-shadow: inset 3px 0 0 ${$accent}; }
  `}
`;

const Rank = styled.span`
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 800;
  color: ${({ theme, $medal }) => ($medal ? '#2a1c00' : theme.colors.textFaint)};
  background: ${({ $medal }) => $medal || 'transparent'};
`;

const Who = styled(Link)`
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
  max-width: 280px;

  .text {
    min-width: 0;
  }

  .name {
    font-size: 13.5px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .group {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    margin-top: 2px;
    color: ${({ theme }) => theme.colors.textFaint};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .swatch {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex: none;
    background: ${({ $groupColor, theme }) => $groupColor || theme.colors.border};
  }

  &:hover .name {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const AverageCell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
`;

const Bar = styled.span`
  display: block;
  width: 76px;
  height: 5px;
  border-radius: 99px;
  background: ${({ theme }) => theme.colors.border};
  overflow: hidden;

  i {
    display: block;
    height: 100%;
    border-radius: 99px;
    width: ${({ $ratio }) => `${Math.max($ratio * 100, 2)}%`};
    background: ${({ theme, $color }) => $color || theme.colors.primary};
    transition: width 700ms ${({ theme }) => theme.ease.out};
  }
`;

/** The verdict on a student's period, in one word. */
const Status = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 25px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 750;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}18`};

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
`;

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  font-weight: 700;
  color: ${({ theme, $tone }) => $tone || theme.colors.textSoft};
`;

const Move = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 750;
  color: ${({ theme, $dir }) =>
    $dir === 'up'
      ? theme.colors.success
      : $dir === 'down'
      ? theme.colors.danger
      : theme.colors.textFaint};
`;

const NewTag = styled.span`
  font-size: 10.5px;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.primarySoft};
  padding: 3px 7px;
  border-radius: 999px;
`;

const Level = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}1C`};
`;

const Faint = styled.span`
  color: ${({ theme }) => theme.colors.textFaint};
  font-size: 12.5px;
`;

const MEDALS = { 1: '#F5C451', 2: '#C8D2DE', 3: '#D89A67' };

const STATUS_KEY = {
  success: 'status.excellent',
  primary: 'status.good',
  warning: 'status.pass',
  danger: 'status.low',
};

/**
 * The dense standings view: one line per student carrying every number a
 * teacher or a parent would ask about, including how far they moved since
 * the period before this one.
 */
export default function StandingsTable({
  rows,
  color,
  showGroup = true,
  groupId = null,
  period = 'week',
  anchor,
}) {
  const { state, settings } = useApp();
  const { t } = useI18n();
  const today = anchor || todayKey();
  const tone = { passMark: settings.passMark, excellentMark: settings.excellentMark };

  const movement = useMemo(() => {
    if (period === 'all') return new Map();
    return rankMovement({
      students: state.students,
      entries: state.entries,
      groupId,
      period,
      anchor: today,
      passMark: settings.passMark,
    });
  }, [state.students, state.entries, groupId, period, today, settings.passMark]);

  if (rows.length === 0) {
    return <EmptyState icon={ClipboardIcon} title={t('leaderboard.noData')} />;
  }

  return (
    <Scroll>
      <Table>
        <thead>
          <tr>
            <th style={{ width: 52 }}>#</th>
            <th>{t('common.student')}</th>
            <th style={{ width: 120 }}>{t('common.average')}</th>
            <th style={{ width: 108 }}>{t('leaderboard.view')}</th>
            <th style={{ width: 74 }}>{t('leaderboard.marks')}</th>
            <th style={{ width: 74 }}>{t('common.best')}</th>
            <th style={{ width: 82 }}>{t('leaderboard.movement')}</th>
            <th style={{ width: 66 }} title={t('dashboard.hotStreaks')}>
              <FlameIcon size={13} style={{ display: 'inline', verticalAlign: -2 }} />
            </th>
            <th style={{ width: 66 }} title={t('common.stars')}>
              <StarIcon size={13} filled style={{ display: 'inline', verticalAlign: -2 }} />
            </th>
            <th style={{ width: 124 }}>{t('levels.title')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const group = state.groups.find((item) => item.id === row.student.groupId);
            const streak = computeStreak(state.entries, row.student.id, {
              skipWeekends: settings.skipWeekends,
              passMark: settings.passMark,
            }).current;
            const stars = starsForStudent(state.awards, row.student.id);
            const overall = averageOf(
              state.entries.filter((entry) => entry.studentId === row.student.id)
            );
            const { level } = levelFor(overall);
            const move = movement.get(row.student.id);
            const podium = row.graded && row.rank <= 3;
            const accent = gradeColor(row.average, tone);

            return (
              <Row
                key={row.student.id}
                $podium={podium}
                $accent={MEDALS[row.rank]}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.018, 0.3), duration: 0.28 }}
              >
                <td>
                  <Rank $medal={row.graded ? MEDALS[row.rank] : null}>{row.rank}</Rank>
                </td>
                <td>
                  <Who href={`/students/${row.student.id}`} $groupColor={group?.color}>
                    <PersonAvatar student={row.student} size={34} />
                    <span className="text">
                      <span className="name">{row.student.name}</span>
                      {showGroup && group && (
                        <span className="group">
                          <span className="swatch" />
                          {group.name}
                        </span>
                      )}
                    </span>
                  </Who>
                </td>
                <td>
                  {row.graded ? (
                    <AverageCell>
                      <GradePill $color={accent} $size="sm">
                        {row.average}
                      </GradePill>
                      <Bar $ratio={row.average / 100} $color={color || accent}>
                        <i />
                      </Bar>
                    </AverageCell>
                  ) : (
                    <Faint>—</Faint>
                  )}
                </td>
                <td>
                  {row.graded ? (
                    <Status $color={accent}>
                      {t(STATUS_KEY[gradeTone(row.average, tone)])}
                    </Status>
                  ) : (
                    <Faint>—</Faint>
                  )}
                </td>
                <td>
                  <Faint>{row.count || '—'}</Faint>
                </td>
                <td>
                  <Faint>{row.graded ? row.best : '—'}</Faint>
                </td>
                <td>
                  {!move || move.unranked ? (
                    <Faint>—</Faint>
                  ) : move.isNew ? (
                    <NewTag>{t('leaderboard.newEntry')}</NewTag>
                  ) : move.delta > 0 ? (
                    <Move $dir="up">
                      <TrendUpIcon size={14} />
                      {move.delta}
                    </Move>
                  ) : move.delta < 0 ? (
                    <Move $dir="down">
                      <TrendDownIcon size={14} />
                      {Math.abs(move.delta)}
                    </Move>
                  ) : (
                    <Faint>—</Faint>
                  )}
                </td>
                <td>
                  {streak > 0 ? (
                    <Chip $tone="#FF7A45">
                      <FlameIcon size={13} filled />
                      {streak}
                    </Chip>
                  ) : (
                    <Faint>—</Faint>
                  )}
                </td>
                <td>
                  {stars > 0 ? (
                    <Chip $tone="#F0B429">
                      <StarIcon size={13} filled />
                      {stars}
                    </Chip>
                  ) : (
                    <Faint>—</Faint>
                  )}
                </td>
                <td>
                  <Level $color={level.color}>{t(`levels.${level.key}`)}</Level>
                </td>
              </Row>
            );
          })}
        </tbody>
      </Table>
    </Scroll>
  );
}
