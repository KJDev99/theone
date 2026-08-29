'use client';

import { useMemo, useState } from 'react';
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
import GroupDialog from '@/components/GroupDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import {
  ChevronRightIcon,
  EditIcon,
  PlusIcon,
  SchoolIcon,
  TrashIcon,
  TrophyIcon,
} from '@/components/Icons';

const GroupCard = styled(motion(Card))`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;

  .head {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .title {
    min-width: 0;
    flex: 1;
  }

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

  .actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 180ms ease;
  }

  &:hover .actions,
  &:focus-within .actions { opacity: 1; }

  @media (hover: none) { .actions { opacity: 1; } }
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

const MiniButton = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSoft};
  transition: color 160ms ease, border-color 160ms ease, background-color 160ms ease;

  &:hover {
    color: ${({ theme, $danger }) => ($danger ? theme.colors.danger : theme.colors.primary)};
    border-color: currentColor;
  }
`;

export default function GroupsPage() {
  const { state, actions, toast } = useApp();
  const { t } = useI18n();
  const [dialog, setDialog] = useState({ open: false, group: null });
  const [confirm, setConfirm] = useState(null);
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
          <h1>{t('groups.title')}</h1>
          <Muted style={{ marginTop: 6 }}>{t('groups.subtitle')}</Muted>
        </div>
        <Button $variant="primary" onClick={() => setDialog({ open: true, group: null })}>
          <PlusIcon size={16} />
          {t('groups.newGroup')}
        </Button>
      </PageHeader>

      {cards.length === 0 ? (
        <Card>
          <EmptyState
            icon={SchoolIcon}
            title={t('groups.noGroups')}
            action={
              <Button
                $variant="primary"
                style={{ marginTop: 4 }}
                onClick={() => setDialog({ open: true, group: null })}
              >
                <PlusIcon size={16} />
                {t('groups.newGroup')}
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
                <div className="title">
                  <div className="name">{group.name}</div>
                  <div className="subject">
                    {group.subject || t('groups.membersCount', { count: summary.size })}
                  </div>
                </div>
                <div className="actions">
                  <MiniButton
                    type="button"
                    onClick={() => setDialog({ open: true, group })}
                    aria-label={t('common.edit')}
                  >
                    <EditIcon size={15} />
                  </MiniButton>
                  <MiniButton
                    type="button"
                    $danger
                    onClick={() => setConfirm(group)}
                    aria-label={t('common.delete')}
                  >
                    <TrashIcon size={15} />
                  </MiniButton>
                </div>
              </div>

              <Row $gap={2} $wrap>
                <Badge $tone="default">
                  {t('groups.membersCount', { count: summary.size })}
                </Badge>
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
                {summary.leader && (
                  <Badge $tone="star">{summary.leader.average}</Badge>
                )}
              </Leader>

              <Button as={Link} href={`/admin/groups/${group.id}`} $full>
                {t('groups.openGroup')}
                <ChevronRightIcon size={16} />
              </Button>
            </GroupCard>
          ))}
        </Grid>
      )}

      <GroupDialog
        open={dialog.open}
        group={dialog.group}
        onClose={() => setDialog({ open: false, group: null })}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={t('groups.deleteGroup')}
        body={t('groups.deleteGroupConfirm', { name: confirm?.name })}
        confirmLabel={t('common.delete')}
        onConfirm={() => {
          actions.removeGroup(confirm.id);
          toast(t('toast.groupDeleted'), 'danger');
        }}
      />
    </>
  );
}
