'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
  entriesForPeriod,
  round1,
} from '@/lib/calc';
import { gradeColor } from '@/lib/levels';
import { addDays, formatShortDate, periodRange, todayKey } from '@/lib/dates';
import {
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
import RankList from '@/components/RankList';
import Podium from '@/components/Podium';
import ScoringPanel from '@/components/ScoringPanel';
import StreakBadge from '@/components/StreakBadge';
import Sparkline from '@/components/Sparkline';
import GroupDialog from '@/components/GroupDialog';
import PersonAvatar from '@/components/PersonAvatar';
import EmptyState from '@/components/EmptyState';
import {
  ChartIcon,
  ChevronRightIcon,
  ClipboardIcon,
  FlameIcon,
  PlusIcon,
  ShieldIcon,
  SparklesIcon,
  StarIcon,
  TargetIcon,
  TrophyIcon,
  UsersIcon,
  ZapIcon,
} from '@/components/Icons';

/**
 * The banner across the top of the panel. It carries the one number a teacher
 * actually opens the app to see, so it never has to be hunted for.
 */
const Hero = styled(Card)`
  position: relative;
  overflow: hidden;
  border: 0;
  padding: 26px 28px;
  margin-bottom: 16px;
  color: #fff;
  background: ${({ theme }) => theme.gradient.brand};

  .glow {
    position: absolute;
    width: 340px;
    height: 340px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.13);
    right: -110px;
    top: -160px;
    pointer-events: none;
  }

  .inner {
    position: relative;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
  }

  h1 {
    font-size: clamp(22px, 3.4vw, 30px);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.15;
  }

  p {
    margin-top: 8px;
    font-size: 14px;
    line-height: 1.55;
    color: rgba(255, 255, 255, 0.82);
    max-width: 46ch;
  }

  .figure {
    display: flex;
    align-items: baseline;
    gap: 4px;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.04em;

    b {
      font-size: 46px;
      font-weight: 800;
      line-height: 1;
    }

    i {
      font-style: normal;
      font-size: 18px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.66);
    }
  }

  .figure-label {
    margin-top: 6px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.72);
    text-align: right;
  }

  ${media.sm`
    padding: 22px 18px;
    .inner { align-items: flex-start; }
    .figure-label { text-align: left; }
  `}
`;

const Columns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  gap: 18px;
  align-items: start;

  ${media.lg`grid-template-columns: minmax(0, 1fr);`}
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

const ActivityItem = styled.li`
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 13px;

  &:last-child {
    border-bottom: 0;
  }

  .who {
    font-weight: 650;
  }
  .why {
    color: ${({ theme }) => theme.colors.textFaint};
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .when {
    margin-left: auto;
    color: ${({ theme }) => theme.colors.textFaint};
    font-size: 11.5px;
    white-space: nowrap;
  }
`;

const EmptyHero = styled(Card)`
  text-align: center;
  padding: 56px 28px;

  .art {
    width: 62px;
    height: 62px;
    margin: 0 auto 16px;
    display: grid;
    place-items: center;
    border-radius: 20px;
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primarySoft};
  }

  h2 {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  p {
    margin: 10px auto 22px;
    max-width: 44ch;
    color: ${({ theme }) => theme.colors.textSoft};
    line-height: 1.6;
    font-size: 14.5px;
  }
`;

const PasswordWarning = styled(Link)`
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px 14px;
  margin-bottom: 16px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.warningSoft};
  color: ${({ theme }) => theme.colors.warning};
  font-size: 13px;
  font-weight: 650;
  line-height: 1.45;
  transition: filter 160ms ease;

  &:hover {
    filter: brightness(1.05);
  }
`;

function greetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return 'dashboard.greetingMorning';
  if (hour < 18) return 'dashboard.greetingAfternoon';
  return 'dashboard.greetingEvening';
}

export default function DashboardPage() {
  const { state, settings, actions } = useApp();
  const { isDefaultPassword } = useAuth();
  const { t, locale } = useI18n();
  const [groupId, setGroupId] = useState(null);
  const [groupDialog, setGroupDialog] = useState(false);
  const [greeting, setGreeting] = useState('dashboard.greetingMorning');
  const today = todayKey();
  const tone = { passMark: settings.passMark, excellentMark: settings.excellentMark };

  useEffect(() => setGreeting(greetingKey()), []);

  useEffect(() => {
    if (state.groups.length === 0) {
      setGroupId(null);
      return;
    }
    if (!groupId || !state.groups.some((group) => group.id === groupId)) {
      setGroupId(state.groups[0].id);
    }
  }, [state.groups, groupId]);

  const weekEntries = useMemo(
    () => entriesForPeriod(state.entries, 'week', today),
    [state.entries, today]
  );

  const lastWeekEntries = useMemo(() => {
    const { from } = periodRange('week', today);
    const previousAnchor = addDays(from, -1);
    return entriesForPeriod(state.entries, 'week', previousAnchor);
  }, [state.entries, today]);

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

  const monthRows = useMemo(
    () =>
      buildLeaderboard({
        students: state.students,
        entries: state.entries,
        period: 'month',
        anchor: today,
        passMark: settings.passMark,
      }),
    [state.students, state.entries, today, settings.passMark]
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

  const recent = useMemo(
    () =>
      [...state.entries]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 8)
        .map((entry) => ({
          entry,
          student: state.students.find((student) => student.id === entry.studentId),
        }))
        .filter((item) => item.student),
    [state.entries, state.students]
  );

  const weekSeries = useMemo(() => {
    const { from, to } = periodRange('week', today);
    return dailySeries(state.entries, from, to);
  }, [state.entries, today]);

  const weekAverage = averageOf(weekEntries);
  const lastWeekAverage = averageOf(lastWeekEntries);
  const trend =
    weekEntries.length && lastWeekEntries.length
      ? round1(weekAverage - lastWeekAverage)
      : null;
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
      <>
        <EmptyHero>
          <div className="art">
            <TargetIcon size={34} />
          </div>
          <h2>{t('dashboard.emptyTitle')}</h2>
          <p>{t('dashboard.emptyBody')}</p>
          <Row $justify="center" $gap={2} $wrap>
            <Button $variant="primary" $size="lg" onClick={() => setGroupDialog(true)}>
              <PlusIcon size={17} />
              {t('dashboard.createGroup')}
            </Button>
            <Button $size="lg" onClick={actions.loadDemo}>
              <SparklesIcon size={17} />
              {t('dashboard.loadDemo')}
            </Button>
          </Row>
        </EmptyHero>
        <GroupDialog open={groupDialog} onClose={() => setGroupDialog(false)} />
      </>
    );
  }

  return (
    <>
      {isDefaultPassword && (
        <PasswordWarning href="/admin/settings">
          <ShieldIcon size={17} />
          {t('admin.defaultWarning')}
        </PasswordWarning>
      )}

      <Hero>
        <span className="glow" />
        <div className="inner">
          <div>
            <h1>
              {t(greeting)}
              {settings.teacherName ? `, ${settings.teacherName}` : ''}
            </h1>
            <p>{t('dashboard.subtitle')}</p>
            <Row $gap={2} $wrap style={{ marginTop: 16 }}>
              <Button $variant="solid" onClick={() => setGroupDialog(true)}>
                <PlusIcon size={16} />
                {t('groups.newGroup')}
              </Button>
              <Button as={Link} href="/admin/awards" $variant="outline" style={{ background: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.28)', color: '#fff' }}>
                <SparklesIcon size={16} />
                {t('nav.awards')}
              </Button>
            </Row>
          </div>
          <div>
            <span className="figure">
              <b>{weekEntries.length ? weekAverage : '—'}</b>
              <i>/ 100</i>
            </span>
            <div className="figure-label">{t('dashboard.statWeekAverage')}</div>
          </div>
        </div>
      </Hero>

      <Grid $min="180px" style={{ marginBottom: 18 }}>
        <StatCard
          label={t('dashboard.statWeekAverage')}
          value={weekAverage}
          suffix="/ 100"
          trend={trend}
          caption={t('common.week')}
          icon={<ChartIcon size={17} />}
          delay={0}
        />
        <StatCard
          label={t('dashboard.statWeekMarks')}
          value={weekEntries.length}
          caption={t('dashboard.statPassRate') + ` ${passRate}%`}
          icon={<ClipboardIcon size={17} />}
          tint="#12A87A"
          delay={0.05}
        />
        <StatCard
          label={t('dashboard.statStudents')}
          value={state.students.length}
          caption={t('settings.counts', {
            groups: state.groups.length,
            students: state.students.length,
            marks: state.entries.length,
          })}
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
            <CardHead>
              <span className="chip">
                <ZapIcon size={18} />
              </span>
              <div className="copy">
                <h2>{t('dashboard.quickScore')}</h2>
                <p>{t('dashboard.quickScoreHint')}</p>
              </div>
            </CardHead>
            <ScoringPanel groupId={groupId} onChangeGroup={setGroupId} />
          </Card>

          <Card>
            <CardHead $tint="#F0B429">
              <span className="chip">
                <TrophyIcon size={18} />
              </span>
              <div className="copy">
                <h2>{t('dashboard.topOfWeek')}</h2>
                <p>{t('leaderboard.rankedBy')}</p>
              </div>
              <div className="action">
                <Button as={Link} href="/leaderboard" $variant="ghost" $size="sm">
                  {t('dashboard.seeAll')}
                  <ChevronRightIcon size={15} />
                </Button>
              </div>
            </CardHead>
            <Podium rows={weekRows} />
            <div style={{ marginTop: 18 }}>
              <RankList rows={weekRows.slice(0, 8)} />
            </div>
          </Card>
        </Stack>

        <Stack $gap={4}>
          <Card>
            <CardHead $tint="#0FA3C7" $gap={12}>
              <span className="chip">
                <ChartIcon size={18} />
              </span>
              <div className="copy">
                <h2>{t('dashboard.statWeekAverage')}</h2>
                <p>{t('settings.passMark')}: {settings.passMark}</p>
              </div>
            </CardHead>
            <Sparkline
              data={weekSeries}
              height={86}
              showAxis
              passMark={settings.passMark}
              color={gradeColor(weekAverage, tone)}
            />
            <Row $justify="space-between" style={{ marginTop: 8 }}>
              <Muted $size="11.5px">
                {formatShortDate(weekSeries[0]?.date || today, locale)}
              </Muted>
              <Muted $size="11.5px">
                {formatShortDate(weekSeries[weekSeries.length - 1]?.date || today, locale)}
              </Muted>
            </Row>
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
              <div>
                {streaks.map(({ student, streak }, index) => (
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
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHead $tint="#8A5BF0" $gap={10}>
              <span className="chip">
                <TrophyIcon size={18} />
              </span>
              <div className="copy">
                <h2>{t('dashboard.topOfMonth')}</h2>
              </div>
            </CardHead>
            <RankList rows={monthRows.slice(0, 5)} showStreak={false} />
          </Card>

          <Card>
            <CardHead $tint="#12A87A" $gap={10}>
              <span className="chip">
                <SparklesIcon size={18} />
              </span>
              <div className="copy">
                <h2>{t('dashboard.recentActivity')}</h2>
              </div>
            </CardHead>
            {recent.length === 0 ? (
              <EmptyState icon={SparklesIcon} title={t('dashboard.noActivity')} pad={26} />
            ) : (
              <ul>
                {recent.map(({ entry, student }) => (
                  <ActivityItem key={entry.id}>
                    <GradePill $color={gradeColor(entry.value, tone)} $size="sm">
                      {entry.value}
                    </GradePill>
                    <div style={{ minWidth: 0 }}>
                      <div className="who">{student.name}</div>
                      {entry.reason && <div className="why">{entry.reason}</div>}
                    </div>
                    <span className="when">
                      {entry.date === today
                        ? t('common.today')
                        : formatShortDate(entry.date, locale)}
                    </span>
                  </ActivityItem>
                ))}
              </ul>
            )}
          </Card>
        </Stack>
      </Columns>

      <GroupDialog open={groupDialog} onClose={() => setGroupDialog(false)} />
    </>
  );
}
