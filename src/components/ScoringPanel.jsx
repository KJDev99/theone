'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/lib/i18n';
import { computeStreak, round1 } from '@/lib/calc';
import { gradeColor } from '@/lib/levels';
import { formatDate, todayKey } from '@/lib/dates';
import { Avatar, Button, Row, media } from './ui';
import { DateField, GradeInput, SelectField, TextField } from './Fields';
import PersonAvatar from './PersonAvatar';
import EmptyState from './EmptyState';
import Modal from './Modal';
import StreakBadge from './StreakBadge';
import { ClipboardIcon, PlusIcon, SparklesIcon, UsersIcon } from './Icons';

const Toolbar = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;

  .grow {
    flex: 1 1 220px;
    min-width: 0;
    max-width: 280px;
  }

  ${media.sm`
    .grow { max-width: none; flex-basis: 100%; }
    > button { flex: 1; }
  `}
`;

const StudentList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 9px;
`;

const StudentRow = styled(motion.li)`
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 13px;
  padding: 11px 13px;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  transition: border-color 180ms ease, background-color 180ms ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }

  ${media.md`
    grid-template-columns: auto minmax(0, 1fr);
    row-gap: 11px;
  `}
`;

const Who = styled.div`
  min-width: 0;

  .name {
    font-size: 14px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;

    a {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    a:hover {
      color: ${({ theme }) => theme.colors.primary};
    }
  }

  .sub {
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    font-size: 11.5px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textFaint};
  }
`;

const Keys = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;

  ${media.md`
    grid-column: 1 / -1;
    overflow-x: auto;
    padding-bottom: 3px;
    &::-webkit-scrollbar { height: 4px; }
  `}
`;

const GradeKey = styled.button.attrs({ type: 'button' })`
  height: 36px;
  min-width: 44px;
  padding: 0 11px;
  flex: none;
  border-radius: 11px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  font-size: 13.5px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.textSoft};
  transition: transform 130ms ${({ theme }) => theme.ease.spring},
    background-color 160ms ease, color 160ms ease, border-color 160ms ease;

  &:hover {
    background: ${({ $color }) => $color};
    border-color: transparent;
    color: #fff;
  }

  &:active {
    transform: scale(0.9);
  }
`;

const MoreKey = styled(GradeKey)`
  min-width: 36px;
  padding: 0;
  display: grid;
  place-items: center;
  border-style: dashed;

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
  }
`;

const Today = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 10px;
  flex: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $color }) => $color || theme.colors.textFaint};
  background: ${({ $color }) => ($color ? `${$color}18` : 'transparent')};
  border: 1px ${({ $color }) => ($color ? 'solid' : 'dashed')}
    ${({ theme, $color }) => ($color ? `${$color}30` : theme.colors.border)};

  small {
    font-size: 10.5px;
    font-weight: 700;
    opacity: 0.7;
  }
`;

const Float = styled(motion.span)`
  position: absolute;
  right: 16px;
  top: 2px;
  font-size: 16px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
  color: ${({ $color }) => $color};
`;

export default function ScoringPanel({ groupId, onChangeGroup, compact = false }) {
  const { state, actions, settings, toast } = useApp();
  const { t, locale } = useI18n();
  const [date, setDate] = useState(todayKey());
  const [flashes, setFlashes] = useState({});
  const [sheetFor, setSheetFor] = useState(null);
  const [sheetGrade, setSheetGrade] = useState(90);
  const [sheetReason, setSheetReason] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkGrade, setBulkGrade] = useState(90);

  const tone = { passMark: settings.passMark, excellentMark: settings.excellentMark };

  const students = useMemo(
    () => state.students.filter((student) => student.groupId === groupId),
    [state.students, groupId]
  );

  // What each student already has on the selected day.
  const onDay = useMemo(() => {
    const map = new Map();
    state.entries.forEach((entry) => {
      if (entry.date !== date) return;
      const bucket = map.get(entry.studentId) || { sum: 0, count: 0 };
      bucket.sum += entry.value;
      bucket.count += 1;
      map.set(entry.studentId, bucket);
    });
    return map;
  }, [state.entries, date]);

  const flash = (studentId, value) => {
    setFlashes((current) => ({ ...current, [studentId]: { value, id: Date.now() } }));
    window.setTimeout(() => {
      setFlashes((current) => {
        const next = { ...current };
        delete next[studentId];
        return next;
      });
    }, 900);
  };

  const grade = (student, value, reason) => {
    actions.addEntry({
      studentId: student.id,
      groupId: student.groupId,
      value,
      reason,
      date,
    });
    flash(student.id, value);
  };

  const submitSheet = (event) => {
    event.preventDefault();
    if (!sheetFor) return;
    grade(sheetFor, sheetGrade, sheetReason.trim());
    toast(t('toast.gradeAdded'));
    setSheetFor(null);
    setSheetReason('');
  };

  const submitBulk = () => {
    if (students.length === 0) return;
    actions.addBulkEntries(
      students.map((student) => student.id),
      { groupId, value: bulkGrade, date, reason: '' }
    );
    students.forEach((student) => flash(student.id, bulkGrade));
    toast(t('toast.gradeAdded'));
    setBulkOpen(false);
  };

  const groupOptions = state.groups.map((group) => ({
    value: group.id,
    label: group.name,
    hint: group.subject || undefined,
    icon: (
      <Avatar $size={24} $color={group.color} style={{ fontSize: 12 }}>
        {group.emoji}
      </Avatar>
    ),
  }));

  return (
    <div>
      <Toolbar>
        {onChangeGroup && groupOptions.length > 0 && (
          <div className="grow">
            <SelectField
              label={t('scoring.group')}
              value={groupId || ''}
              onChange={onChangeGroup}
              options={groupOptions}
            />
          </div>
        )}

        <DateField
          value={date}
          max={todayKey()}
          onChange={(next) => setDate(next || todayKey())}
          label={t('scoring.changeDate')}
          display={date === todayKey() ? t('common.today') : formatDate(date, locale)}
        />

        {students.length > 0 && (
          <Button $variant="soft" $size="lg" onClick={() => setBulkOpen(true)}>
            <SparklesIcon size={17} />
            {t('scoring.bulkTitle')}
          </Button>
        )}
      </Toolbar>

      {students.length === 0 ? (
        <EmptyState icon={UsersIcon} title={t('students.noStudents')} />
      ) : (
        <StudentList>
          {students.map((student, index) => {
            const day = onDay.get(student.id);
            const dayAverage = day ? round1(day.sum / day.count) : null;
            const dayColor = dayAverage === null ? null : gradeColor(dayAverage, tone);
            const streak = computeStreak(state.entries, student.id, {
              skipWeekends: settings.skipWeekends,
              passMark: settings.passMark,
            }).current;
            const flashState = flashes[student.id];

            return (
              <StudentRow
                key={student.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.025, 0.3), duration: 0.3 }}
              >
                <PersonAvatar student={student} size={40} />
                <Who>
                  <div className="name">
                    <Link href={`/students/${student.id}`}>{student.name}</Link>
                    {!compact && streak > 0 && (
                      <StreakBadge count={streak} goal={settings.streakGoal} size="sm" />
                    )}
                  </div>
                  <div className="sub">
                    {day
                      ? t('scoring.dayCount', { count: day.count })
                      : t('scoring.notGradedToday')}
                  </div>
                </Who>

                <Keys>
                  <Today $color={dayColor}>
                    {dayAverage === null ? '—' : dayAverage}
                    {day && day.count > 1 && <small>×{day.count}</small>}
                  </Today>
                  {settings.quickGrades.map((value) => (
                    <GradeKey
                      key={value}
                      $color={gradeColor(value, tone)}
                      onClick={() => grade(student, value)}
                    >
                      {value}
                    </GradeKey>
                  ))}
                  <MoreKey
                    onClick={() => {
                      setSheetFor(student);
                      setSheetGrade(settings.quickGrades[0] ?? 90);
                      setSheetReason('');
                    }}
                    aria-label={t('scoring.custom')}
                  >
                    <PlusIcon size={15} />
                  </MoreKey>
                </Keys>

                <AnimatePresence>
                  {flashState && (
                    <Float
                      key={flashState.id}
                      $color={gradeColor(flashState.value, tone)}
                      initial={{ opacity: 0, y: 8, scale: 0.7 }}
                      animate={{ opacity: 1, y: -14, scale: 1 }}
                      exit={{ opacity: 0, y: -28 }}
                      transition={{ duration: 0.5 }}
                    >
                      {flashState.value}
                    </Float>
                  )}
                </AnimatePresence>
              </StudentRow>
            );
          })}
        </StudentList>
      )}

      <Modal
        open={Boolean(sheetFor)}
        onClose={() => setSheetFor(null)}
        title={t('scoring.title')}
        description={sheetFor ? sheetFor.name : ''}
      >
        <form onSubmit={submitSheet}>
          <GradeInput
            label={t('scoring.gradeLabel')}
            value={sheetGrade}
            onChange={setSheetGrade}
            presets={settings.quickGrades}
            passMark={settings.passMark}
            excellentMark={settings.excellentMark}
            autoFocus
          />
          <div style={{ marginTop: 18 }}>
            <TextField
              label={t('common.reason')}
              value={sheetReason}
              placeholder={t('scoring.reasonPlaceholder')}
              icon={ClipboardIcon}
              onChange={(event) => setSheetReason(event.target.value)}
            />
          </div>
          <Row $justify="flex-end" $gap={2} style={{ marginTop: 22 }}>
            <Button type="button" $variant="ghost" onClick={() => setSheetFor(null)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" $variant="primary">
              {t('common.add')}
            </Button>
          </Row>
        </form>
      </Modal>

      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title={t('scoring.bulkTitle')}
        description={t('scoring.bulkConfirm', {
          count: bulkGrade,
          students: students.length,
        })}
        footer={
          <>
            <Button $variant="ghost" onClick={() => setBulkOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button $variant="primary" onClick={submitBulk}>
              {t('common.confirm')}
            </Button>
          </>
        }
      >
        <GradeInput
          label={t('scoring.gradeLabel')}
          value={bulkGrade}
          onChange={setBulkGrade}
          presets={settings.quickGrades}
          passMark={settings.passMark}
          excellentMark={settings.excellentMark}
        />
      </Modal>
    </div>
  );
}
