'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useApp } from '@/context/AppContext';
import { gradeColor } from '@/lib/levels';
import PersonAvatar from './PersonAvatar';
import EmptyState from './EmptyState';
import { Avatar, Card, GradePill, Row } from './ui';
import { ChevronRightIcon, ClipboardIcon } from './Icons';

const Shell = styled(motion(Card))`
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px 14px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ $color }) => `linear-gradient(180deg, ${$color}14, transparent)`};

  .title { min-width: 0; flex: 1; }

  .name {
    font-size: 14.5px;
    font-weight: 750;
    letter-spacing: -0.015em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sub {
    font-size: 11.5px;
    color: ${({ theme }) => theme.colors.textFaint};
    margin-top: 2px;
  }
`;

const List = styled.ul`
  flex: 1;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Entry = styled.li`
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  transition: background-color 160ms ease;

  &:hover { background: ${({ theme }) => theme.colors.surfaceAlt}; }
`;

const Track = styled.span`
  position: absolute;
  inset: 0;
  width: ${({ $ratio }) => `${$ratio * 100}%`};
  background: ${({ $color }) => `${$color}12`};
`;

const EntryLink = styled(Link)`
  position: relative;
  display: grid;
  grid-template-columns: 22px auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;

  .rank {
    font-size: 12px;
    font-weight: 800;
    color: ${({ theme, $medal }) => $medal || theme.colors.textFaint};
    text-align: center;
  }

  .name {
    font-size: 13px;
    font-weight: 620;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .points {
    font-size: 13.5px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  &:hover .name { color: ${({ theme }) => theme.colors.primary}; }
`;

const Foot = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 12.5px;
  font-weight: 650;
  color: ${({ theme }) => theme.colors.textSoft};
  transition: color 160ms ease, background-color 160ms ease;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.surfaceAlt};
  }
`;

const MEDALS = { 1: '#E0A81C', 2: '#8E9AAB', 3: '#C07C4A' };

/** One compact board per group — the "every class has its own table" view. */
export default function GroupBoardCard({ group, rows, limit = 5, delay = 0 }) {
  const { t } = useI18n();
  const { settings } = useApp();
  const tone = { passMark: settings.passMark, excellentMark: settings.excellentMark };
  const scored = rows.filter((row) => row.graded);
  const marks = scored.reduce((sum, row) => sum + row.count, 0);
  const average = marks
    ? Math.round((scored.reduce((sum, row) => sum + row.sum, 0) / marks) * 10) / 10
    : 0;

  return (
    <Shell
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Head $color={group.color}>
        <Avatar $size={40} $color={group.color}>
          {group.emoji}
        </Avatar>
        <div className="title">
          <div className="name">{group.name}</div>
          <div className="sub">
            {t('groups.membersCount', { count: rows.length })} ·{' '}
            {t('groups.marksCount', { count: marks })}
          </div>
        </div>
        <GradePill $color={gradeColor(average, tone)}>{marks ? average : '—'}</GradePill>
      </Head>

      {scored.length === 0 ? (
        <EmptyState icon={ClipboardIcon} title={t('leaderboard.noData')} pad={26} />
      ) : (
        <List>
          {scored.slice(0, limit).map((row) => (
            <Entry key={row.student.id}>
              <Track $ratio={row.average / 100} $color={group.color} />
              <EntryLink href={`/students/${row.student.id}`} $medal={MEDALS[row.rank]}>
                <span className="rank">{row.rank}</span>
                <PersonAvatar student={row.student} size={26} />
                <span className="name">{row.student.name}</span>
                <span className="points" style={{ color: gradeColor(row.average, tone) }}>
                  {row.average}
                </span>
              </EntryLink>
            </Entry>
          ))}
        </List>
      )}

      <Foot href={`/groups/${group.id}`}>
        <Row $gap={2}>{t('leaderboard.openBoard')}</Row>
        <ChevronRightIcon size={16} />
      </Foot>
    </Shell>
  );
}
