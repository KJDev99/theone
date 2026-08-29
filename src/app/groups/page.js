'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/lib/i18n';
import { groupSummary } from '@/lib/calc';
import { todayKey } from '@/lib/dates';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Grid,
  Muted,
  PageHeader,
  Row,
} from '@/components/ui';
import EmptyState from '@/components/EmptyState';
import { ChevronRightIcon, SchoolIcon, ShieldIcon, TrophyIcon } from '@/components/Icons';

const GroupCard = styled(motion(Card))`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;

  .head { display: flex; align-items: flex-start; gap: 12px; }

  .name {
    font-size: 15.5px;
    font-weight: 750;
    letter-spacing: -0.015em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .subject {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textFaint};
    margin-top: 2px;
  }
`;

const Leader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceAlt};

  .label {
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: ${({ theme }) => theme.colors.textFaint};
    font-weight: 700;
  }

  .name {
    font-size: 13.5px;
    font-weight: 650;
    margin-top: 1px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export default function PublicGroupsPage() {
  const { state } = useApp();
  const { t } = useI18n();
  const today = todayKey();

  const cards = useMemo(
    () =>
      state.groups.map((group) => ({
        group,
        summary: groupSummary(state, group.id, 'week', today),
      })),
    [state, today]
  );

  return (
    <>
      <PageHeader>
        <div>
          <h1>{t('public.classes')}</h1>
          <Muted style={{ marginTop: 6 }}>{t('public.readOnly')}</Muted>
        </div>
      </PageHeader>

      {cards.length === 0 ? (
        <Card>
          <EmptyState
            icon={SchoolIcon}
            title={t('groups.noGroups')}
            body={t('public.emptyBody')}
            action={
              <Button as={Link} href="/admin" style={{ marginTop: 4 }}>
                <ShieldIcon size={16} />
                {t('public.teacherArea')}
              </Button>
            }
          />
        </Card>
      ) : (
        <Grid $min="280px">
          {cards.map(({ group, summary }, index) => (
            <GroupCard
              key={group.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.4 }}
            >
              <div className="head">
                <Avatar $size={46} $color={group.color}>
                  {group.emoji}
                </Avatar>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="name">{group.name}</div>
                  <div className="subject">
                    {group.subject || t('groups.membersCount', { count: summary.size })}
                  </div>
                </div>
              </div>

              <Row $gap={2} $wrap>
                <Badge>{t('groups.membersCount', { count: summary.size })}</Badge>
                <Badge $tone="primary">
                  {t('groups.weekAverage', { count: summary.marks ? summary.average : '—' })}
                </Badge>
              </Row>

              <Leader>
                <TrophyIcon size={17} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="label">{t('groups.leaderThisWeek')}</div>
                  <div className="name">
                    {summary.leader
                      ? summary.leader.student.name
                      : t('groups.noLeader')}
                  </div>
                </div>
                {summary.leader && <Badge $tone="star">{summary.leader.average}</Badge>}
              </Leader>

              <Button as={Link} href={`/groups/${group.id}`} $full>
                {t('groups.openGroup')}
                <ChevronRightIcon size={16} />
              </Button>
            </GroupCard>
          ))}
        </Grid>
      )}
    </>
  );
}
