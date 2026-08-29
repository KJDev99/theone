'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/lib/i18n';
import {
  averageOf,
  buildLeaderboard,
  computeStreak,
  dailySeries,
  rankMovement,
  starsForStudent,
  trophiesForStudent,
} from '@/lib/calc';
import { gradeColor } from '@/lib/levels';
import { achievementsFor } from '@/lib/achievements';
import { addDays, formatDate, formatMonth, formatShortDate, todayKey } from '@/lib/dates';
import {
  Badge,
  Button,
  Card,
  CardHead,
  GradePill,
  Grid,
  IconButton,
  Muted,
  PageHeader,
  Row,
  Stack,
  media,
} from '@/components/ui';
import StatCard from '@/components/StatCard';
import LevelBadge from '@/components/LevelBadge';
import ActivityBars from '@/components/ActivityBars';
import StreakBadge from '@/components/StreakBadge';
import StudentDialog from '@/components/StudentDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import ShareSheet from '@/components/ShareSheet';
import PersonAvatar from '@/components/PersonAvatar';
import EmptyState from '@/components/EmptyState';
import Achievements from '@/components/Achievements';
import {
  ArrowLeftIcon,
  AwardIcon,
  ChartIcon,
  ClipboardIcon,
  EditIcon,
  FlameIcon,
  MedalIcon,
  SearchIcon,
  ShareIcon,
  StarIcon,
  TrashIcon,
  TrophyIcon,
} from '@/components/Icons';

const Back = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textFaint};
  margin-bottom: 14px;

  &:hover { color: ${({ theme }) => theme.colors.text}; }
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  min-width: 0;

  h1 {
    font-size: clamp(21px, 3.6vw, 30px);
    font-weight: 800;
    letter-spacing: -0.025em;
  }
`;

const HistoryItem = styled(motion.li)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 4px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child { border-bottom: 0; }

  .value {
    min-width: 46px;
    text-align: center;
    font-weight: 800;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
    padding: 5px 0;
    border-radius: 9px;
    color: ${({ $color }) => $color};
    background: ${({ $color }) => `${$color}18`};
    border: 1px solid ${({ $color }) => `${$color}2E`};
  }

  .reason { font-size: 13.5px; font-weight: 600; }
  .date { font-size: 11.5px; color: ${({ theme }) => theme.colors.textFaint}; margin-top: 2px; }

  .remove { margin-left: auto; opacity: 0; transition: opacity 160ms ease; }
  &:hover .remove { opacity: 1; }
  @media (hover: none) { .remove { opacity: 1; } }
`;

const AwardChip = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 11px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 13px;

  .label { font-weight: 650; }
  .sub { font-size: 11.5px; color: ${({ theme }) => theme.colors.textFaint}; margin-top: 1px; }
  .stars {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: ${({ theme }) => theme.colors.star};
    font-weight: 800;
  }

  .glyph { display: grid; place-items: center; }
`;

export default function StudentPage() {
  const params = useParams();
  const router = useRouter();
  const { state, actions, settings, toast } = useApp();
  const { authed } = useAuth();
  const { t, locale } = useI18n();
  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const today = todayKey();
  const tone = { passMark: settings.passMark, excellentMark: settings.excellentMark };

  const student = state.students.find((item) => item.id === params.id);
  const group = student
    ? state.groups.find((item) => item.id === student.groupId)
    : null;

  const entries = useMemo(
    () =>
      state.entries
        .filter((entry) => entry.studentId === params.id)
        .sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : b.date.localeCompare(a.date))),
    [state.entries, params.id]
  );

  const streak = useMemo(
    () =>
      student
        ? computeStreak(state.entries, student.id, {
            skipWeekends: settings.skipWeekends,
            passMark: settings.passMark,
          })
        : { current: 0, best: 0 },
    [state.entries, student, settings.skipWeekends, settings.passMark]
  );

  const weekRow = useMemo(() => {
    if (!student) return null;
    return buildLeaderboard({
      students: state.students,
      entries: state.entries,
      groupId: student.groupId,
      period: 'week',
      anchor: today,
      passMark: settings.passMark,
    }).find((row) => row.student.id === student.id);
  }, [state.students, state.entries, student, today, settings.passMark]);

  const monthRow = useMemo(() => {
    if (!student) return null;
    return buildLeaderboard({
      students: state.students,
      entries: state.entries,
      groupId: student.groupId,
      period: 'month',
      anchor: today,
      passMark: settings.passMark,
    }).find((row) => row.student.id === student.id);
  }, [state.students, state.entries, student, today, settings.passMark]);

  const series = useMemo(
    () => (student ? dailySeries(state.entries, addDays(today, -29), today, student.id) : []),
    [state.entries, student, today]
  );

  const awards = useMemo(
    () =>
      state.awards
        .filter((award) => award.studentId === params.id)
        .sort((a, b) => b.createdAt - a.createdAt),
    [state.awards, params.id]
  );

  const move = useMemo(() => {
    if (!student) return null;
    return rankMovement({
      students: state.students,
      entries: state.entries,
      groupId: student.groupId,
      period: 'week',
      anchor: today,
      passMark: settings.passMark,
    }).get(student.id);
  }, [state.students, state.entries, student, today, settings.passMark]);

  const badges = useMemo(
    () =>
      student
        ? achievementsFor(state, student.id, {
            today,
            skipWeekends: settings.skipWeekends,
            streakGoal: settings.streakGoal,
            passMark: settings.passMark,
            excellentMark: settings.excellentMark,
          })
        : [],
    [
      state,
      student,
      today,
      settings.skipWeekends,
      settings.streakGoal,
      settings.passMark,
      settings.excellentMark,
    ]
  );

  if (!student) {
    return (
      <Card>
        <EmptyState
          icon={SearchIcon}
          title={t('common.empty')}
          action={
            <Button as={Link} href="/groups" style={{ marginTop: 4 }}>
              {t('common.back')}
            </Button>
          }
        />
      </Card>
    );
  }

  const stars = starsForStudent(state.awards, student.id);
  const trophies = trophiesForStudent(state.awards, student.id);
  const overall = averageOf(entries);

  return (
    <>
      <Back href={group ? `${authed ? '/admin' : ''}/groups/${group.id}` : '/groups'}>
        <ArrowLeftIcon size={15} />
        {group ? group.name : t('groups.title')}
      </Back>

      <PageHeader>
        <Head>
          <PersonAvatar student={student} size={64} glow />
          <div style={{ minWidth: 0 }}>
            <h1>{student.name}</h1>
            <Row $gap={2} $wrap style={{ marginTop: 7 }}>
              {group && (
                <Badge $tone="primary">
                  {group.emoji} {group.name}
                </Badge>
              )}
              {streak.current > 0 && (
                <StreakBadge count={streak.current} goal={settings.streakGoal} />
              )}
              {stars > 0 && (
                <Badge $tone="star">
                  <StarIcon size={12} filled />
                  {stars}
                </Badge>
              )}
              <LevelBadge average={overall} size="sm" />
            </Row>
          </div>
        </Head>

        <Row $gap={2}>
          <Button $variant="primary" onClick={() => setShareOpen(true)}>
            <ShareIcon size={16} />
            {t('common.share')}
          </Button>
          {authed && (
            <>
              <IconButton onClick={() => setEditOpen(true)} aria-label={t('common.edit')}>
                <EditIcon size={16} />
              </IconButton>
              <IconButton
                $variant="danger"
                onClick={() => setConfirmDelete(true)}
                aria-label={t('common.delete')}
              >
                <TrashIcon size={16} />
              </IconButton>
            </>
          )}
        </Row>
      </PageHeader>

      <Grid $min="165px" style={{ marginBottom: 18 }}>
        <StatCard
          label={t('common.week')}
          value={weekRow ? weekRow.average : 0}
          suffix="/ 100"
          trend={move && !move.unranked && !move.isNew ? move.gain : null}
          caption={
            weekRow && weekRow.graded
              ? `#${weekRow.rank} · ${weekRow.count} ${t('common.grades')}`
              : t('scoring.notGradedToday')
          }
          icon={<ChartIcon size={17} />}
        />
        <StatCard
          label={t('common.month')}
          value={monthRow ? monthRow.average : 0}
          suffix="/ 100"
          caption={
            monthRow && monthRow.graded
              ? `#${monthRow.rank} · ${monthRow.count} ${t('common.grades')}`
              : ''
          }
          icon={<TrophyIcon size={17} />}
          tint="#12A87A"
          delay={0.05}
        />
        <StatCard
          label={t('students.streakLabel', { count: streak.current })}
          value={streak.best}
          caption={t('students.bestStreak')}
          icon={<FlameIcon size={17} />}
          tint="#FF7A45"
          delay={0.1}
        />
        <StatCard
          label={t('students.totalStars')}
          value={stars}
          caption={t('students.firstPlaces') + `: ${trophies}`}
          icon={<StarIcon size={17} filled />}
          tint="#F0B429"
          delay={0.15}
        />
        <StatCard
          label={t('students.overallAverage')}
          value={overall}
          suffix="/ 100"
          caption={t('students.marksTotal') + `: ${entries.length}`}
          icon={<AwardIcon size={17} />}
          tint="#8A5BF0"
          delay={0.2}
        />
      </Grid>

      <Grid $min="330px">
        <Stack $gap={4}>
          <Card>
            <CardHead $tint="#8A5BF0">
              <span className="chip">
                <AwardIcon size={18} />
              </span>
              <div className="copy">
                <h2>{t('levels.title')}</h2>
                <p>{t('levels.basedOn')}</p>
              </div>
              <div className="action">
                <GradePill $color={gradeColor(overall, tone)}>{overall || '—'}</GradePill>
              </div>
            </CardHead>
            <LevelBadge average={overall} showProgress />
          </Card>

          <Card>
            <CardHead $tint="#F0B429">
              <span className="chip">
                <TrophyIcon size={18} />
              </span>
              <div className="copy">
                <h2>{t('badges.title')}</h2>
              </div>
            </CardHead>
            <Achievements items={badges} />
          </Card>

          <Card>
            <CardHead $tint="#0FA3C7">
              <span className="chip">
                <ChartIcon size={18} />
              </span>
              <div className="copy">
                <h2>{t('students.activityTitle')}</h2>
                <p>
                  {t('settings.passMark')}: {settings.passMark}
                </p>
              </div>
            </CardHead>
            <ActivityBars data={series} color={group?.color} />
            <Row $justify="space-between" style={{ marginTop: 8 }}>
              <Muted $size="11.5px">{formatShortDate(addDays(today, -29), locale)}</Muted>
              <Muted $size="11.5px">{t('common.today')}</Muted>
            </Row>
          </Card>

          <Card>
            <CardHead $tint="#F2547D">
              <span className="chip">
                <StarIcon size={18} filled />
              </span>
              <div className="copy">
                <h2>{t('awards.history')}</h2>
              </div>
            </CardHead>
            {awards.length === 0 ? (
              <Muted $size="13px">{t('awards.noAwards')}</Muted>
            ) : (
              <Stack $gap={2}>
                {awards.map((award) => (
                  <AwardChip key={award.id}>
                    <span
                      className="glyph"
                      style={{
                        color:
                          award.rank === 1
                            ? '#F0B429'
                            : award.rank === 2
                            ? '#9AA6B8'
                            : award.rank === 3
                            ? '#D89A67'
                            : '#8A5BF0',
                      }}
                    >
                      {award.rank > 0 ? <MedalIcon size={18} /> : <StarIcon size={18} filled />}
                    </span>
                    <div>
                      <div className="label">
                        {award.period === 'manual'
                          ? t('awards.manual')
                          : award.rank === 1
                          ? t('awards.rank1')
                          : award.rank === 2
                          ? t('awards.rank2')
                          : t('awards.rank3')}
                      </div>
                      <div className="sub">
                        {award.period === 'month'
                          ? formatMonth(award.periodKey, locale)
                          : award.period === 'week'
                          ? t('awards.weekAward', { key: award.periodKey.split('-W')[1] })
                          : award.note || formatDate(award.periodKey, locale)}
                      </div>
                    </div>
                    <span className="stars">
                      +{award.stars}
                      <StarIcon size={13} filled />
                    </span>
                  </AwardChip>
                ))}
              </Stack>
            )}
          </Card>
        </Stack>

        <Card>
          <CardHead>
            <span className="chip">
              <ClipboardIcon size={18} />
            </span>
            <div className="copy">
              <h2>{t('students.historyTitle')}</h2>
              <p>{entries.length ? `${entries.length} ${t('common.grades')}` : ''}</p>
            </div>
          </CardHead>
          {entries.length === 0 ? (
            <EmptyState icon={ClipboardIcon} title={t('students.noHistory')} pad={30} />
          ) : (
            <ul style={{ maxHeight: 460, overflowY: 'auto' }}>
              {entries.slice(0, 60).map((entry, index) => (
                <HistoryItem
                  key={entry.id}
                  $color={gradeColor(entry.value, tone)}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.3) }}
                >
                  <span className="value">{entry.value}</span>
                  <div>
                    <div className="reason">{entry.reason || t('common.grade')}</div>
                    <div className="date">
                      {entry.date === today
                        ? t('common.today')
                        : formatDate(entry.date, locale)}
                    </div>
                  </div>
                  {authed && (
                    <IconButton
                      className="remove"
                      $size="sm"
                      $variant="ghost"
                      onClick={() => {
                        actions.removeEntry(entry.id);
                        toast(t('toast.entryDeleted'), 'danger');
                      }}
                      aria-label={t('common.delete')}
                    >
                      <TrashIcon size={14} />
                    </IconButton>
                  )}
                </HistoryItem>
              ))}
            </ul>
          )}
        </Card>
      </Grid>

      <StudentDialog
        open={editOpen}
        student={student}
        groupId={student.groupId}
        onClose={() => setEditOpen(false)}
      />

      <ShareSheet open={shareOpen} student={student} onClose={() => setShareOpen(false)} />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t('students.deleteStudent')}
        body={t('students.deleteStudentConfirm', { name: student.name })}
        confirmLabel={t('common.delete')}
        onConfirm={() => {
          actions.removeStudent(student.id);
          toast(t('toast.studentDeleted'), 'danger');
          router.push(group ? `/admin/groups/${group.id}` : '/admin/groups');
        }}
      />
    </>
  );
}
