'use client';

import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/lib/i18n';
import { periodRange, todayKey } from '@/lib/dates';
import Modal from './Modal';
import { Button, Hint, Muted, Stack } from './ui';
import { Label } from './Fields';
import { RotateIcon, StarIcon } from './Icons';

const Choice = styled.button.attrs({ type: 'button' })`
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  padding: 13px 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  text-align: left;
  border: 1.5px solid
    ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.border)};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primarySoft : theme.colors.surfaceAlt};
  transition: border-color 160ms ease, background-color 160ms ease;

  .dot {
    width: 17px;
    height: 17px;
    flex: none;
    border-radius: 50%;
    border: 2px solid
      ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.borderStrong)};
    display: grid;
    place-items: center;

    &::after {
      content: '';
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: ${({ theme, $active }) => ($active ? theme.colors.primary : 'transparent')};
    }
  }

  .label { font-size: 14px; font-weight: 650; }
  .count {
    margin-left: auto;
    font-size: 12px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textFaint};
    font-variant-numeric: tabular-nums;
  }
`;

const Warning = styled.div`
  display: flex;
  gap: 10px;
  padding: 12px 13px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.warningSoft};
  color: ${({ theme }) => theme.colors.warning};
  font-size: 12.5px;
  line-height: 1.55;
  font-weight: 600;
`;

export default function ResetDialog({ open, onClose, groupId = null }) {
  const { state, actions, toast } = useApp();
  const { t } = useI18n();
  const [scope, setScope] = useState('week');
  const today = todayKey();

  const counts = useMemo(() => {
    const scoped = groupId
      ? state.entries.filter((entry) => entry.groupId === groupId)
      : state.entries;
    const week = periodRange('week', today);
    const month = periodRange('month', today);
    return {
      week: scoped.filter((entry) => entry.date >= week.from && entry.date <= week.to).length,
      month: scoped.filter((entry) => entry.date >= month.from && entry.date <= month.to).length,
      all: scoped.length,
    };
  }, [state.entries, groupId, today]);

  const target = groupId
    ? state.groups.find((group) => group.id === groupId)?.name || ''
    : t('common.allGroups');

  const options = [
    { key: 'week', label: t('reset.scopeWeek'), count: counts.week },
    { key: 'month', label: t('reset.scopeMonth'), count: counts.month },
    { key: 'all', label: t('reset.scopeAll'), count: counts.all },
  ];

  const apply = () => {
    actions.resetGrades({ scope, groupId });
    toast(t('reset.done'), 'danger');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('reset.title')}
      description={t('reset.subtitle')}
      footer={
        <>
          <Button $variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button $variant="danger" onClick={apply} disabled={counts[scope] === 0}>
            <RotateIcon size={16} />
            {t('common.reset')}
          </Button>
        </>
      }
    >
      <Stack $gap={4}>
        <div>
          <Label>{t('reset.target')}</Label>
          <Muted $size="13px">{target}</Muted>
        </div>

        <div>
          <Label>{t('reset.scope')}</Label>
          <Stack $gap={2}>
            {options.map((option) => (
              <Choice
                key={option.key}
                $active={scope === option.key}
                onClick={() => setScope(option.key)}
              >
                <span className="dot" />
                <span className="label">{option.label}</span>
                <span className="count">{option.count}</span>
              </Choice>
            ))}
          </Stack>
        </div>

        <Warning>
          <StarIcon size={16} filled />
          <span>
            {t('reset.keepAwards')} — {t('reset.keepAwardsHint')}
          </span>
        </Warning>

        <Hint>
          {t('reset.confirmBody', { count: counts[scope], target })}
        </Hint>
      </Stack>
    </Modal>
  );
}
