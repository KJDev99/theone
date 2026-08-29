'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/lib/i18n';
import {
  averageOf,
  buildLeaderboard,
  computeStreak,
  entriesForPeriod,
  groupSummary,
} from '@/lib/calc';
import { gradeColor } from '@/lib/levels';
import { todayKey } from '@/lib/dates';
import {
  Avatar,
  Button,
  Card,
  CardHead,
  Grid,
  GradePill,
  Muted,
  Row,
  Stack,
  media,
} from '@/components/ui';
import StatCard from '@/components/StatCard';
import StudentFinder from '@/components/StudentFinder';
import Podium from '@/components/Podium';
import StandingsTable from '@/components/StandingsTable';
import StreakBadge from '@/components/StreakBadge';
import PersonAvatar from '@/components/PersonAvatar';
import EmptyState from '@/components/EmptyState';
import GroupRace from '@/components/GroupRace';
import {
  ChartIcon,
  ChevronRightIcon,
  ClipboardIcon,
  FlameIcon,
  ListIcon,
  SchoolIcon,
  SearchIcon,
  ShieldIcon,
  StarIcon,
  SwordsIcon,
  TrophyIcon,
  UsersIcon,
} from '@/components/Icons';

const Hero = styled(Card)`
  position: relative;
  overflow: hidden;
  padding: 34px 30px;
  margin-bottom: 18px;
  border: 0;
  background: ${({ theme }) => theme.gradient.brand};
  color: #fff;

  h1 {
    font-size: clamp(24px, 4.4vw, 36px);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.12;
    max-width: 18ch;
  }

  p {
    margin-top: 10px;
    font-size: 14.5px;
    line-height: 1.55;
    color: rgba(255, 255, 255, 0.84);
    max-width: 46ch;
  }

  .glow {
    position: absolute;
    width: 320px;
    height: 320px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.14);
    right: -90px;
    top: -140px;
    pointer-events: none;
  }

  ${media.sm`padding: 26px 18px;`}
`;

const FinderCard = styled(Card)`
  margin-top: 22px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  position: relative;
`;

const GroupCard = styled(motion(Card))`
  padding: 16px;

  .head {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .name {
    font-size: 14.5px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .subject {
    font-size: 11.5px;
    color: ${({ theme }) => theme.colors.textFaint};
    margin-top: 2px;
  }

  .leader {
    margin-top: 13px;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px 10px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.surfaceAlt};
    font-size: 12.5px;
    font-weight: 650;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const StreakRow = styled(Link)`
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 10px;
  border-radius: ${({ theme }) => theme.radius.md};
  transition: background-color 180ms ease;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
  }

  .name {
    font-size: 13.5px;
    font-weight: 650;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const Columns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 18px;
  align-items: start;

  ${media.lg`grid-template-columns: minmax(0, 1fr);`}
`;

export default function PublicHomePage() {
  const { state, settings } = useApp();
  const { t } = useI18n();
  const today = todayKey();
  const tone = { passMark: settings.passMark, excellentMark: settings.excellentMark };

  const weekRows = useMemo(
    () =>
      buildLeaderboard({
        students: state.students,
        entries: state.entries,
        period: 'week',
        anchor: today,
        passMark: settings.passMark,
      }),
    [state.students, state.entries, today, settings.passMark]
  );

  const weekEntries = useMemo(
    () => entriesForPeriod(state.entries, 'week', today),
    [state.entries, today]
  );

  const streaks = useMemo(
    () =>
      state.students
        .map((student) => ({
          student,
          streak: computeStreak(state.entries, student.id, {
            skipWeekends: settings.skipWeekends,
            passMark: settings.passMark,
          }).current,
        }))
        .filter((item) => item.streak > 0)
        .sort((a, b) => b.streak - a.streak)
        .slice(0, 6),
    [state.students, state.entries, settings.skipWeekends, settings.passMark]
  );

  const classes = useMemo(
    () =>
      state.groups.map((group) => ({
        group,
        summary: groupSummary(state, group.id, 'week', today),
      })),
    [state, today]
  );

  // Class against class on the average mark, so a group of six is not beaten
  // on headcount alone.
  const race = useMemo(
    () =>
      classes
        .map(({ group, summary }) => ({ group, average: summary.average }))
        .sort((a, b) => b.average - a.average),
    [classes]
  );

  const weekAverage = averageOf(weekEntries);
  const passRate = weekEntries.length
    ? Math.round(
        (weekEntries.filter((entry) => entry.value >= settings.passMark).length /
          weekEntries.length) *
          100
      )
    : 0;
  const totalStars = state.awards.reduce((sum, award) => sum + award.stars, 0);

  if (state.groups.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={SchoolIcon}
          title={t('public.emptyTitle')}
          body={t('public.emptyBody')}
          action={
            <Button as={Link} href="/admin" $variant="primary" style={{ marginTop: 4 }}>
              <ShieldIcon size={16} />
              {t('public.teacherArea')}
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <>
      <Hero>
        <span className="glow" />
        <h1>{t('public.heroTitle')}</h1>
        <p>{t('public.heroBody')}</p>
        <FinderCard>
          <CardHead $gap={12}>
            <span className="chip">
              <SearchIcon size={18} />
            </span>
            <div className="copy">
              <h2>{t('public.findYou')}</h2>
            </div>
          </CardHead>
          <StudentFinder />
        </FinderCard>
      </Hero>

      <Grid $min="180px" style={{ marginBottom: 18 }}>
        <StatCard
          label={t('dashboard.statWeekAverage')}
          value={weekAverage}
          suffix="/ 100"
          caption={`${t('dashboard.statPassRate')} ${passRate}%`}
          icon={<ChartIcon size={17} />}
        />
        <StatCard
          label={t('dashboard.statWeekMarks')}
          value={weekEntries.length}
          icon={<ClipboardIcon size={17} />}
          tint="#12A87A"
          delay={0.05}
        />
        <StatCard
          label={t('dashboard.statStudents')}
          value={state.students.length}
          caption={t('groups.membersCount', { count: state.students.length })}
          icon={<UsersIcon size={17} />}
          tint="#E9A21B"
          delay={0.1}
        />
        <StatCard
          label={t('dashboard.statStars')}
          value={totalStars}
          icon={<StarIcon size={17} filled />}
          tint="#F2547D"
          delay={0.15}
        />
      </Grid>

      <Columns>
        <Stack $gap={4}>
          <Card>
            <CardHead $tint="#F0B429">
              <span className="chip">
                <TrophyIcon size={18} />
              </span>
              <div className="copy">
                <h2>{t('public.thisWeek')}</h2>
                <p>{t('leaderboard.rankedBy')}</p>
              </div>
              <div className="action">
                <Button as={Link} href="/leaderboard" $variant="ghost" $size="sm">
                  {t('public.browseAll')}
                  <ChevronRightIcon size={15} />
                </Button>
              </div>
            </CardHead>
            <Podium rows={weekRows} />
          </Card>

          <Card>
            <CardHead>
              <span className="chip">
                <ListIcon size={18} />
              </span>
              <div className="copy">
                <h2>{t('public.topStudents')}</h2>
                <p>{t('public.readOnly')}</p>
              </div>
            </CardHead>
            <StandingsTable rows={weekRows.slice(0, 12)} />
          </Card>
        </Stack>

        <Stack $gap={4}>
          <Card>
            <CardHead $tint="#8A5BF0">
              <span className="chip">
                <SwordsIcon size={18} />
              </span>
              <div className="copy">
                <h2>{t('public.race')}</h2>
                <p>{t('public.raceHint')}</p>
              </div>
            </CardHead>
            <GroupRace lanes={race} />
          </Card>

          <Card>
            <CardHead $tint="#FF7A45" $gap={10}>
              <span className="chip">
                <FlameIcon size={18} />
              </span>
              <div className="copy">
                <h2>{t('dashboard.hotStreaks')}</h2>
              </div>
            </CardHead>
            {streaks.length === 0 ? (
              <Muted $size="13px">{t('dashboard.noStreaks')}</Muted>
            ) : (
              streaks.map(({ student, streak }, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <StreakRow href={`/students/${student.id}`}>
                    <PersonAvatar student={student} size={32} />
                    <span className="name">{student.name}</span>
                    <StreakBadge count={streak} goal={settings.streakGoal} size="sm" />
                  </StreakRow>
                </motion.div>
              ))
            )}
          </Card>

          <Card>
            <CardHead $tint="#0FA3C7">
              <span className="chip">
                <UsersIcon size={18} />
              </span>
              <div className="copy">
                <h2>{t('public.classes')}</h2>
              </div>
              <div className="action">
                <Button as={Link} href="/groups" $variant="ghost" $size="sm">
                  {t('dashboard.seeAll')}
                  <ChevronRightIcon size={15} />
                </Button>
              </div>
            </CardHead>
            <Stack $gap={2}>
              {classes.slice(0, 4).map(({ group, summary }, index) => (
                <GroupCard
                  key={group.id}
                  as={Link}
                  href={`/groups/${group.id}`}
                  $hover
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="head">
                    <Avatar $size={40} $color={group.color}>
                      {group.emoji}
                    </Avatar>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="name">{group.name}</div>
                      <div className="subject">
                        {t('groups.membersCount', { count: summary.size })}
                      </div>
                    </div>
                    <GradePill $color={gradeColor(summary.average, tone)}>
                      {summary.marks ? summary.average : '—'}
                    </GradePill>
                  </div>
                  <div className="leader">
                    <TrophyIcon size={15} />
                    {summary.leader ? summary.leader.student.name : t('groups.noLeader')}
                  </div>
                </GroupCard>
              ))}
            </Stack>
          </Card>
        </Stack>
      </Columns>

      <Row $justify="center" style={{ marginTop: 22 }}>
        <Muted $size="12px">{t('public.readOnly')}</Muted>
      </Row>
    </>
  );
}
