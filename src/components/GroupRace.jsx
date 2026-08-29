'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Avatar, Muted } from './ui';

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Lane = styled(motion.li)`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;

  .body { min-width: 0; }

  .top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 6px;
  }

  .name {
    font-size: 13px;
    font-weight: 680;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .value {
    font-size: 13px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  &:hover .name { color: ${({ theme }) => theme.colors.primary}; }
`;

const Track = styled.span`
  display: block;
  height: 10px;
  border-radius: 99px;
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
`;

const Fill = styled(motion.span)`
  display: block;
  height: 100%;
  border-radius: 99px;
  background: ${({ $color }) => `linear-gradient(90deg, ${$color}88, ${$color})`};
`;

/**
 * Class against class, measured per student so a group of six is not beaten
 * by a group of twenty purely on headcount.
 */
export default function GroupRace({ lanes }) {
  const { t } = useI18n();
  if (lanes.length === 0) return <Muted $size="13px">{t('groups.noGroups')}</Muted>;

  return (
    <List>
      {lanes.map((lane, index) => (
        <Lane
          key={lane.group.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.07, duration: 0.35 }}
        >
          <Avatar $size={34} $color={lane.group.color}>
            {lane.group.emoji}
          </Avatar>
          <Link href={`/groups/${lane.group.id}`} className="body">
            <span className="top">
              <span className="name">{lane.group.name}</span>
              <span className="value">{lane.average.toFixed(1)}</span>
            </span>
            <Track>
              <Fill
                $color={lane.group.color}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(lane.average, 3)}%` }}
                transition={{
                  delay: 0.1 + index * 0.07,
                  duration: 0.8,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            </Track>
          </Link>
        </Lane>
      ))}
    </List>
  );
}
