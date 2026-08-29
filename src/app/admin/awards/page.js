'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/lib/i18n';
import { pendingPeriods } from '@/lib/calc';
import { formatMonth } from '@/lib/dates';
import {
  Badge,
  Button,
  Card,
  Grid,
  IconButton,
  Muted,
  PageHeader,
  Row,
  SectionTitle,
  Stack,
  media,
} from '@/components/ui';
import { Field, SelectField, Stepper, TextField } from '@/components/Fields';
import Modal from '@/components/Modal';
import Confetti from '@/components/Confetti';
import PersonAvatar from '@/components/PersonAvatar';
import EmptyState from '@/components/EmptyState';
import {
  PartyIcon,
  SparklesIcon,
  StarIcon,
  TrashIcon,
  TrophyIcon,
} from '@/components/Icons';

const Pending = styled(Card)`
  position: relative;
  overflow: hidden;
  border: 0;
  background: ${({ theme }) => theme.gradient.warm};
  color: #24160a;
  margin-bottom: 18px;

  h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 17px;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  p { font-size: 13.5px; margin-top: 5px; opacity: 0.8; max-width: 46ch; }
`;

const AwardRow = styled(motion.li)`
  display: grid;
  grid-template-columns: auto auto 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};

  .name { font-size: 14px; font-weight: 650; }
  .name:hover { color: ${({ theme }) => theme.colors.primary}; }
  .meta { font-size: 11.5px; color: ${({ theme }) => theme.colors.textFaint}; margin-top: 2px; }

  ${media.sm`
    grid-template-columns: auto 1fr auto;
    .medal { grid-row: 1; }
  `}
`;

const Medal = styled.span`
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  font-size: 15px;
  background: ${({ $color }) => `${$color}22`};
  color: ${({ $color }) => $color};
  font-weight: 800;
`;

const StarPill = styled(Badge)`
  background: ${({ theme }) => theme.colors.warningSoft};
  color: ${({ theme }) => theme.colors.star};
  font-variant-numeric: tabular-nums;
`;

const RANK_COLORS = { 1: '#F5C451', 2: '#9AA6B8', 3: '#D89A67', 0: '#8A5BF0' };

export default function AwardsPage() {
  const { state, actions, closePeriods, toast, setCelebration } = useApp();
  const { t, locale } = useI18n();
  const [bonusOpen, setBonusOpen] = useState(false);
  const [bonusStudent, setBonusStudent] = useState('');
  const [bonusStars, setBonusStars] = useState('1');
  const [bonusNote, setBonusNote] = useState('');

  const pending = useMemo(() => pendingPeriods(state), [state]);

  const awards = useMemo(
    () =>
      state.awards
        .filter((award) => award.studentId)
        .map((award) => ({
          award,
          student: state.students.find((student) => student.id === award.studentId),
          group: state.groups.find((group) => group.id === award.groupId),
        }))
        .filter((item) => item.student)
        .sort((a, b) => b.award.createdAt - a.award.createdAt),
    [state.awards, state.students, state.groups]
  );

  const totalStars = state.awards.reduce((sum, award) => sum + award.stars, 0);

  const closeAll = () => {
    const created = closePeriods(pending);
    const winner = created.find((award) => award.rank === 1);
    if (winner) {
      const student = state.students.find((item) => item.id === winner.studentId);
      if (student) setCelebration({ student, stars: winner.stars, award: winner });
    }
    toast(t('awards.closed'));
  };

  const giveBonus = (event) => {
    event.preventDefault();
    const student = state.students.find((item) => item.id === bonusStudent);
    if (!student || !Number(bonusStars)) return;
    actions.giveStars({
      studentId: student.id,
      groupId: student.groupId,
      stars: Number(bonusStars),
      note: bonusNote.trim(),
    });
    toast(t('toast.starsAdded'));
    setBonusOpen(false);
    setBonusNote('');
    setBonusStars('1');
  };

  const periodLabel = (award) => {
    if (award.period === 'manual') return t('awards.manual');
    if (award.period === 'month') return formatMonth(award.periodKey, locale);
    return t('awards.weekAward', { key: award.periodKey.split('-W')[1] });
  };

  return (
    <>
      <PageHeader>
        <div>
          <h1>{t('awards.title')}</h1>
          <Muted style={{ marginTop: 6 }}>{t('awards.subtitle')}</Muted>
        </div>
        <Row $gap={2}>
          <Button
            $variant="primary"
            onClick={() => {
              setBonusStudent(state.students[0]?.id || '');
              setBonusOpen(true);
            }}
            disabled={state.students.length === 0}
          >
            <StarIcon size={16} filled />
            {t('students.giveStars')}
          </Button>
        </Row>
      </PageHeader>

      {pending.length > 0 && (
        <Pending>
          <Confetti count={22} duration={3.4} />
          <Row $justify="space-between" $wrap $gap={4} style={{ position: 'relative' }}>
            <div>
              <h3>
                <PartyIcon size={18} /> {t('awards.pending')}
              </h3>
              <p>{t('awards.pendingBody', { count: pending.length })}</p>
            </div>
            <Button $variant="solid" onClick={closeAll}>
              <SparklesIcon size={16} />
              {t('awards.closeAll')}
            </Button>
          </Row>
        </Pending>
      )}

      <Grid $min="180px" style={{ marginBottom: 18 }}>
        <Card $pad={4}>
          <Muted $size="12px">{t('common.stars')}</Muted>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>{totalStars}</div>
        </Card>
        <Card $pad={4}>
          <Muted $size="12px">{t('awards.rank1')}</Muted>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>
            {state.awards.filter((award) => award.rank === 1).length}
          </div>
        </Card>
        <Card $pad={4}>
          <Muted $size="12px">{t('awards.history')}</Muted>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>{awards.length}</div>
        </Card>
      </Grid>

      <Card>
        <SectionTitle style={{ marginBottom: 14 }}>
          <TrophyIcon size={18} /> {t('awards.history')}
        </SectionTitle>

        {awards.length === 0 ? (
          <EmptyState icon={TrophyIcon} title={t('awards.noAwards')} />
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {awards.map(({ award, student, group }, index) => (
              <AwardRow
                key={award.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.025, 0.3) }}
              >
                <Medal className="medal" $color={RANK_COLORS[award.rank] || RANK_COLORS[0]}>
                  {award.rank > 0 ? award.rank : <StarIcon size={15} filled />}
                </Medal>
                <PersonAvatar student={student} size={36} />
                <div style={{ minWidth: 0 }}>
                  <Link className="name" href={`/students/${student.id}`}>
                    {student.name}
                  </Link>
                  <div className="meta">
                    {periodLabel(award)}
                    {group ? ` · ${group.name}` : ''}
                    {award.note ? ` · ${award.note}` : ''}
                    {award.points ? ` · ${award.points} ${t('common.outOf')}` : ''}
                  </div>
                </div>
                <StarPill>
                  <StarIcon size={12} filled />
                  {award.stars}
                </StarPill>
                <IconButton
                  $size="sm"
                  $variant="ghost"
                  onClick={() => actions.removeAward(award.id)}
                  aria-label={t('common.delete')}
                >
                  <TrashIcon size={15} />
                </IconButton>
              </AwardRow>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={bonusOpen}
        onClose={() => setBonusOpen(false)}
        title={t('students.giveStars')}
      >
        <form onSubmit={giveBonus}>
          <Stack $gap={4}>
            <SelectField
              label={t('common.student')}
              value={bonusStudent}
              onChange={setBonusStudent}
              options={state.students.map((student) => ({
                value: student.id,
                label: student.name,
                hint:
                  state.groups.find((group) => group.id === student.groupId)?.name ||
                  undefined,
                icon: <PersonAvatar student={student} size={24} />,
              }))}
            />
            <Row $gap={3} $align="flex-end" $wrap>
              <Field label={t('common.stars')}>
                <Stepper
                  value={Number(bonusStars) || 1}
                  min={1}
                  max={50}
                  onChange={(value) => setBonusStars(String(value))}
                />
              </Field>
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <TextField
                  label={t('students.starNote')}
                  value={bonusNote}
                  placeholder={t('students.starNotePlaceholder')}
                  onChange={(event) => setBonusNote(event.target.value)}
                />
              </div>
            </Row>
          </Stack>
          <Row $justify="flex-end" $gap={2} style={{ marginTop: 22 }}>
            <Button type="button" $variant="ghost" onClick={() => setBonusOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" $variant="primary">
              <StarIcon size={16} filled />
              {t('common.add')}
            </Button>
          </Row>
        </form>
      </Modal>
    </>
  );
}
