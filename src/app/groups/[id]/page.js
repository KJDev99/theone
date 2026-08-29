'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styled from 'styled-components';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/lib/i18n';
import { buildLeaderboard, dailySeries, groupSummary } from '@/lib/calc';
import { periodRange, todayKey } from '@/lib/dates';
import {
  Avatar,
  Button,
  Card,
  Grid,
  Muted,
  PageHeader,
  Row,
  SectionTitle,
  Stack,
} from '@/components/ui';
import { Segmented } from '@/components/Fields';
import StatCard from '@/components/StatCard';
import Podium from '@/components/Podium';
import StandingsTable from '@/components/StandingsTable';
import Sparkline from '@/components/Sparkline';
import ShareSheet from '@/components/ShareSheet';
import EmptyState from '@/components/EmptyState';
import {
  ArrowLeftIcon,
  ChartIcon,
  SearchIcon,
  SettingsIcon,
  ShareIcon,
  StarIcon,
  TrophyIcon,
  UsersIcon,
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

export default function PublicGroupPage() {
  const params = useParams();
  const { state } = useApp();
  const { authed } = useAuth();
  const { t } = useI18n();
  const [period, setPeriod] = useState('week');
  const [shareOpen, setShareOpen] = useState(false);
  const today = todayKey();

  const group = state.groups.find((item) => item.id === params.id);

  const students = useMemo(
    () => state.students.filter((student) => student.groupId === params.id),
    [state.students, params.id]
  );

  const rows = useMemo(
    () =>
      group
        ? buildLeaderboard({
            students: state.students,
            entries: state.entries,
            groupId: group.id,
            period,
            anchor: today,
          })
        : [],
    [state.students, state.entries, group, period, today]
  );

  const summary = useMemo(
    () => (group ? groupSummary(state, group.id, 'week', today) : null),
    [state, group, today]
  );

  const series = useMemo(() => {
    if (!group) return [];
    const { from, to } = periodRange(period === 'all' ? 'month' : period, today);
    return dailySeries(
      state.entries.filter((entry) => entry.groupId === group.id),
      from,
      to
    );
  }, [state.entries, group, period, today]);

  if (!group) {
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

  const stars = state.awards
    .filter((award) => award.groupId === group.id)
    .reduce((sum, award) => sum + award.stars, 0);

  const graded = rows.filter((row) => row.graded);
  const periodMarks = graded.reduce((sum, row) => sum + row.count, 0);
  const periodAverage = periodMarks
    ? Math.round((graded.reduce((sum, row) => sum + row.sum, 0) / periodMarks) * 10) / 10
    : 0;

  return (
    <>
      <Back href="/groups">
        <ArrowLeftIcon size={15} />
        {t('public.classes')}
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
          {authed && (
            <Button as={Link} href={`/admin/groups/${group.id}`} $variant="primary">
              <SettingsIcon size={16} />
              {t('nav.scoring')}
            </Button>
          )}
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
          label={period === 'week' ? t('common.week') : t('common.month')}
          value={periodAverage}
          suffix="/ 100"
          caption={t('groups.marksCount', { count: periodMarks })}
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

      <Row $justify="space-between" $wrap $gap={3} style={{ marginBottom: 16 }}>
        <Segmented
          name="group-period"
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'week', label: t('common.week') },
            { value: 'month', label: t('common.month') },
            { value: 'all', label: t('common.allTime') },
          ]}
        />
        <Muted $size="12.5px">{t('public.readOnly')}</Muted>
      </Row>

      <Stack $gap={4}>
        <Card>
          <SectionTitle style={{ marginBottom: 10 }}>
            <TrophyIcon size={18} /> {t('leaderboard.podium')}
          </SectionTitle>
          <Podium rows={rows} />
        </Card>

        <Card>
          <SectionTitle style={{ marginBottom: 14 }}>
            {t('leaderboard.fullTable')}
          </SectionTitle>
          <StandingsTable rows={rows} color={group.color} showGroup={false} />
        </Card>

        <Card>
          <SectionTitle style={{ marginBottom: 10 }}>
            <ChartIcon size={17} /> {t('students.activityTitle')}
          </SectionTitle>
          <Sparkline data={series} height={90} color={group.color} showAxis />
        </Card>
      </Stack>

      <ShareSheet open={shareOpen} group={group} onClose={() => setShareOpen(false)} />
    </>
  );
}
