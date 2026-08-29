'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/lib/i18n';
import {
  buildLeaderboard,
  computeStreak,
  dailySeries,
  groupSummary,
  starsForStudent,
} from '@/lib/calc';
import { periodRange, todayKey } from '@/lib/dates';
import {
  Avatar,
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
import { Segmented } from '@/components/Fields';
import ScoringPanel from '@/components/ScoringPanel';
import RankList from '@/components/RankList';
import Podium from '@/components/Podium';
import Sparkline from '@/components/Sparkline';
import StreakBadge from '@/components/StreakBadge';
import StudentDialog from '@/components/StudentDialog';
import GroupDialog from '@/components/GroupDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import ShareSheet from '@/components/ShareSheet';
import ResetDialog from '@/components/ResetDialog';
import StatCard from '@/components/StatCard';
import PersonAvatar from '@/components/PersonAvatar';
import EmptyState from '@/components/EmptyState';
import {
  ArrowLeftIcon,
  ChartIcon,
  EditIcon,
  MedalIcon,
  PlusIcon,
  RotateIcon,
  SearchIcon,
  ShareIcon,
  StarIcon,
  TrashIcon,
  TrophyIcon,
  UsersIcon,
  ZapIcon,
} from '@/components/Icons';

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;

  h1 {
    font-size: clamp(21px, 3.6vw, 29px);
    font-weight: 800;
    letter-spacing: -0.025em;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

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

const StudentItem = styled(motion.li)`
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};

  .name {
    font-size: 14px;
    font-weight: 650;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .name a {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .name a:hover { color: ${({ theme }) => theme.colors.primary}; }

  .sub {
    margin-top: 3px;
    font-size: 11.5px;
    color: ${({ theme }) => theme.colors.textFaint};
    display: flex;
    gap: 9px;
  }

  ${media.sm`
    grid-template-columns: auto 1fr auto;
    .tools { grid-column: 1 / -1; justify-self: end; }
  `}
`;

const Tools = styled(Row).attrs({ className: 'tools' })`
  gap: 4px;
`;

export default function GroupDetailPage() {
  const params = useParams();
  const { state, actions, settings, toast } = useApp();
  const { t } = useI18n();
  const [tab, setTab] = useState('score');
  const [studentDialog, setStudentDialog] = useState({ open: false, student: null });
  const [groupDialog, setGroupDialog] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const today = todayKey();

  const group = state.groups.find((item) => item.id === params.id);

  const students = useMemo(
    () => state.students.filter((student) => student.groupId === params.id),
    [state.students, params.id]
  );

  const summary = useMemo(
    () => (group ? groupSummary(state, group.id, 'week', today) : null),
    [state, group, today]
  );

  const monthRows = useMemo(
    () =>
      group
        ? buildLeaderboard({
            students: state.students,
            entries: state.entries,
            groupId: group.id,
            period: 'month',
            anchor: today,
          })
        : [],
    [state.students, state.entries, group, today]
  );

  // The mean of every mark in the month, not the mean of the students means.
  const monthAverage = useMemo(() => {
    const graded = monthRows.filter((row) => row.graded);
    const marks = graded.reduce((sum, row) => sum + row.count, 0);
    if (!marks) return 0;
    return Math.round((graded.reduce((sum, row) => sum + row.sum, 0) / marks) * 10) / 10;
  }, [monthRows]);

  const series = useMemo(() => {
    if (!group) return [];
    const { from, to } = periodRange('month', today);
    return dailySeries(
      state.entries.filter((entry) => entry.groupId === group.id),
      from,
      to
    );
  }, [state.entries, group, today]);

  if (!group) {
    return (
      <Card>
        <EmptyState
          icon={SearchIcon}
          title={t('common.empty')}
          action={
            <Button as={Link} href="/admin/groups" style={{ marginTop: 4 }}>
              {t('common.back')}
            </Button>
          }
        />
      </Card>
    );
  }

  const stars = state.awards
    .filter((award) => award.groupId === group.id)
    .reduce((sum, award) => sum + award.stars, 0);

  return (
    <>
      <Back href="/admin/groups">
        <ArrowLeftIcon size={15} />
        {t('groups.title')}
      </Back>

      <PageHeader>
        <Head>
          <Avatar $size={54} $color={group.color}>
            {group.emoji}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <h1>{group.name}</h1>
            <Muted $size="13px" style={{ marginTop: 4 }}>
              {group.subject ? `${group.subject} · ` : ''}
              {t('groups.membersCount', { count: students.length })}
            </Muted>
          </div>
        </Head>

        <Row $gap={2} $wrap>
          <Button onClick={() => setShareOpen(true)}>
            <ShareIcon size={16} />
            {t('common.share')}
          </Button>
          <Button onClick={() => setResetOpen(true)}>
            <RotateIcon size={16} />
            {t('common.reset')}
          </Button>
          <IconButton onClick={() => setGroupDialog(true)} aria-label={t('common.edit')}>
            <EditIcon size={16} />
          </IconButton>
          <Button
            $variant="primary"
            onClick={() => setStudentDialog({ open: true, student: null })}
          >
            <PlusIcon size={16} />
            {t('students.add')}
          </Button>
        </Row>
      </PageHeader>

      <Grid $min="170px" style={{ marginBottom: 18 }}>
        <StatCard
          label={t('dashboard.statStudents')}
          value={students.length}
          icon={<UsersIcon size={17} />}
          tint={group.color}
        />
        <StatCard
          label={t('dashboard.statWeekAverage')}
          value={summary.average}
          suffix="/ 100"
          caption={t('groups.marksCount', { count: summary.marks })}
          icon={<ChartIcon size={17} />}
          tint="#12A87A"
          delay={0.05}
        />
        <StatCard
          label={t('common.month')}
          value={monthAverage}
          suffix="/ 100"
          caption={t('dashboard.statPassRate') + ` ${summary.passRate}%`}
          icon={<TrophyIcon size={17} />}
          tint="#E9A21B"
          delay={0.1}
        />
        <StatCard
          label={t('common.stars')}
          value={stars}
          icon={<StarIcon size={17} filled />}
          tint="#F2547D"
          delay={0.15}
        />
      </Grid>

      <div style={{ marginBottom: 16 }}>
        <Segmented
          name="group-tab"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'score', label: t('scoring.title'), icon: <ZapIcon size={15} /> },
            { value: 'board', label: t('leaderboard.title'), icon: <TrophyIcon size={15} /> },
            { value: 'students', label: t('students.title'), icon: <UsersIcon size={15} /> },
          ]}
        />
      </div>

      {tab === 'score' && (
        <Card>
          <ScoringPanel groupId={group.id} />
        </Card>
      )}

      {tab === 'board' && (
        <Stack $gap={4}>
          <Card>
            <SectionTitle style={{ marginBottom: 10 }}>
              <TrophyIcon size={18} /> {t('leaderboard.thisWeek')}
            </SectionTitle>
            <Podium rows={summary.rows} />
            <div style={{ marginTop: 18 }}>
              <RankList rows={summary.rows} color={group.color} />
            </div>
          </Card>

          <Grid $min="300px">
            <Card>
              <SectionTitle style={{ marginBottom: 10 }}>
                <ChartIcon size={17} /> {t('common.month')}
              </SectionTitle>
              <Sparkline data={series} height={80} color={group.color} showAxis />
            </Card>
            <Card>
              <SectionTitle style={{ marginBottom: 10 }}>
                <MedalIcon size={17} /> {t('leaderboard.thisMonth')}
              </SectionTitle>
              <RankList rows={monthRows.slice(0, 6)} color={group.color} showStreak={false} />
            </Card>
          </Grid>
        </Stack>
      )}

      {tab === 'students' && (
        <Card>
          {students.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title={t('students.noStudents')}
              action={
                <Button
                  $variant="primary"
                  style={{ marginTop: 4 }}
                  onClick={() => setStudentDialog({ open: true, student: null })}
                >
                  <PlusIcon size={16} />
                  {t('students.add')}
                </Button>
              }
            />
          ) : (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {students.map((student, index) => {
                const streak = computeStreak(state.entries, student.id, {
                  skipWeekends: settings.skipWeekends,
                }).current;
                const row = summary.rows.find((item) => item.student.id === student.id);
                return (
                  <StudentItem
                    key={student.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                  >
                    <PersonAvatar student={student} size={40} />
                    <div style={{ minWidth: 0 }}>
                      <div className="name">
                        <Link href={`/students/${student.id}`}>{student.name}</Link>
                        {streak > 0 && (
                          <StreakBadge count={streak} goal={settings.streakGoal} size="sm" />
                        )}
                      </div>
                      <div className="sub">
                        <span>
                          {row && row.graded ? `${row.average} / 100` : '—'} ·{' '}
                          {t('common.week')}
                        </span>
                        <span
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <StarIcon size={12} filled />
                          {starsForStudent(state.awards, student.id)}
                        </span>
                      </div>
                    </div>
                    <Badge $tone={row && row.rank <= 3 && row.graded ? 'star' : 'default'}>
                      #{row ? row.rank : '—'}
                    </Badge>
                    <Tools>
                      <IconButton
                        $size="sm"
                        $variant="ghost"
                        onClick={() => setStudentDialog({ open: true, student })}
                        aria-label={t('common.edit')}
                      >
                        <EditIcon size={15} />
                      </IconButton>
                      <IconButton
                        $size="sm"
                        $variant="ghost"
                        onClick={() => setConfirm(student)}
                        aria-label={t('common.delete')}
                      >
                        <TrashIcon size={15} />
                      </IconButton>
                    </Tools>
                  </StudentItem>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      <StudentDialog
        open={studentDialog.open}
        student={studentDialog.student}
        groupId={group.id}
        onClose={() => setStudentDialog({ open: false, student: null })}
      />

      <GroupDialog open={groupDialog} group={group} onClose={() => setGroupDialog(false)} />

      <ShareSheet open={shareOpen} group={group} onClose={() => setShareOpen(false)} />

      <ResetDialog open={resetOpen} groupId={group.id} onClose={() => setResetOpen(false)} />

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={t('students.deleteStudent')}
        body={t('students.deleteStudentConfirm', { name: confirm?.name })}
        confirmLabel={t('common.delete')}
        onConfirm={() => {
          actions.removeStudent(confirm.id);
          toast(t('toast.studentDeleted'), 'danger');
        }}
      />
    </>
  );
}
