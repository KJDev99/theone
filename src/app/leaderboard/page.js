'use client';

import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/lib/i18n';
import { averageOf, buildLeaderboard, dailySeries, entriesForPeriod } from '@/lib/calc';
import { gradeColor } from '@/lib/levels';
import {
  diffInDays,
  labelForPeriod,
  periodKeyOf,
  periodRange,
  shiftPeriod,
  todayKey,
} from '@/lib/dates';
import {
  Avatar,
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
  SectionTitle,
  Stack,
  media,
} from '@/components/ui';
import { Segmented, SelectField } from '@/components/Fields';
import Podium from '@/components/Podium';
import StandingsTable from '@/components/StandingsTable';
import GroupBoardCard from '@/components/GroupBoardCard';
import Sparkline from '@/components/Sparkline';
import ShareSheet from '@/components/ShareSheet';
import EmptyState from '@/components/EmptyState';
import {
  ChartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListIcon,
  ShareIcon,
  TrophyIcon,
  UsersIcon,
} from '@/components/Icons';

const Controls = styled(Row)`
  flex-wrap: wrap;
  margin-bottom: 18px;

  ${media.sm`
    > * { flex: 1 1 auto; }
  `}
`;

const PeriodNav = styled(Row)`
  gap: 6px;
  padding: 4px;
  border-radius: ${({ theme }) => theme.radius.pill};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};

  .label {
    min-width: 168px;
    text-align: center;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  ${media.sm`.label { min-width: 0; flex: 1; }`}
`;

/** Podium on the left, the period's shape on the right — no dead column. */
const TopBand = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 16px;
  margin-bottom: 16px;
  align-items: stretch;

  ${media.lg`grid-template-columns: minmax(0, 1fr);`}
`;

const PodiumCard = styled(Card)`
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 150px;
    background: ${({ theme }) => theme.gradient.mesh};
    pointer-events: none;
  }
`;

const Facts = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
`;

const Fact = styled.div`
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  padding: 11px 12px;

  b {
    display: block;
    font-size: 19px;
    font-weight: 800;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }

  span {
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${({ theme }) => theme.colors.textFaint};
    font-weight: 700;
  }
`;

export default function LeaderboardPage() {
  const { state, settings } = useApp();
  const { t, locale } = useI18n();
  const [period, setPeriod] = useState('week');
  const [groupId, setGroupId] = useState('');
  const [anchor, setAnchor] = useState(todayKey());
  const [shareOpen, setShareOpen] = useState(false);
  const [view, setView] = useState('combined');
  const today = todayKey();
  const tone = { passMark: settings.passMark, excellentMark: settings.excellentMark };

  const rows = useMemo(
    () =>
      buildLeaderboard({
        students: state.students,
        entries: state.entries,
        groupId: groupId || null,
        period,
        anchor,
        passMark: settings.passMark,
      }),
    [state.students, state.entries, groupId, period, anchor, settings.passMark]
  );

  const series = useMemo(() => {
    if (period === 'all') return [];
    const { from, to } = periodRange(period, anchor);
    return dailySeries(
      groupId ? state.entries.filter((entry) => entry.groupId === groupId) : state.entries,
      from,
      to
    );
  }, [state.entries, groupId, period, anchor]);

  const isCurrent =
    period === 'all' || periodKeyOf(period, anchor) === periodKeyOf(period, today);

  const daysLeft = useMemo(() => {
    if (period === 'all' || !isCurrent) return null;
    const { to } = periodRange(period, today);
    return diffInDays(to, today);
  }, [period, isCurrent, today]);

  // One board per group, for the "every class has its own table" view.
  const groupBoards = useMemo(
    () =>
      state.groups
        .filter((item) => !groupId || item.id === groupId)
        .map((item) => ({
          group: item,
          rows: buildLeaderboard({
            students: state.students,
            entries: state.entries,
            groupId: item.id,
            period,
            anchor,
            passMark: settings.passMark,
          }),
        })),
    [
      state.groups,
      state.students,
      state.entries,
      groupId,
      period,
      anchor,
      settings.passMark,
    ]
  );

  const group = state.groups.find((item) => item.id === groupId) || null;
  const scored = rows.filter((row) => row.graded);
  const best = scored[0];

  // Every mark inside the period, so the summary is a true mean rather than an
  // average of per-student averages.
  const periodMarks = useMemo(() => {
    const pool = groupId
      ? state.entries.filter((entry) => entry.groupId === groupId)
      : state.entries;
    return entriesForPeriod(pool, period, anchor);
  }, [state.entries, groupId, period, anchor]);

  const average = averageOf(periodMarks);
  const passRate = periodMarks.length
    ? Math.round(
        (periodMarks.filter((entry) => entry.value >= settings.passMark).length /
          periodMarks.length) *
          100
      )
    : 0;

  return (
    <>
      <PageHeader>
        <div>
          <h1>{t('leaderboard.title')}</h1>
          <Muted style={{ marginTop: 6 }}>{t('leaderboard.subtitle')}</Muted>
        </div>
        <Button onClick={() => setShareOpen(true)} disabled={rows.length === 0}>
          <ShareIcon size={16} />
          {t('common.share')}
        </Button>
      </PageHeader>

      <Controls $gap={2}>
        <Segmented
          name="period"
          value={period}
          onChange={(next) => {
            setPeriod(next);
            if (next !== 'all') setAnchor(today);
          }}
          options={[
            { value: 'week', label: t('common.week') },
            { value: 'month', label: t('common.month') },
            { value: 'all', label: t('common.allTime') },
          ]}
        />

        <div style={{ maxWidth: 250, flex: '1 1 200px' }}>
          <SelectField
            value={groupId}
            onChange={setGroupId}
            options={[
              { value: '', label: t('leaderboard.combined') },
              ...state.groups.map((item) => ({
                value: item.id,
                label: item.name,
                hint: item.subject || undefined,
                icon: (
                  <Avatar $size={24} $color={item.color} style={{ fontSize: 12 }}>
                    {item.emoji}
                  </Avatar>
                ),
              })),
            ]}
          />
        </div>

        {period !== 'all' && (
          <PeriodNav>
            <IconButton
              $size="sm"
              $variant="ghost"
              onClick={() => setAnchor(shiftPeriod(period, anchor, -1))}
              aria-label={t('leaderboard.previous')}
            >
              <ChevronLeftIcon size={16} />
            </IconButton>
            <span className="label">{labelForPeriod(period, anchor, locale)}</span>
            <IconButton
              $size="sm"
              $variant="ghost"
              disabled={isCurrent}
              onClick={() => setAnchor(shiftPeriod(period, anchor, 1))}
              aria-label={t('leaderboard.next')}
            >
              <ChevronRightIcon size={16} />
            </IconButton>
          </PeriodNav>
        )}

        {period !== 'all' && (
          <Badge $tone={isCurrent ? 'success' : 'default'}>
            {isCurrent ? t('leaderboard.live') : t('leaderboard.finished')}
          </Badge>
        )}

        <div style={{ marginLeft: 'auto' }}>
          <Segmented
            name="view"
            value={view}
            onChange={setView}
            options={[
              {
                value: 'combined',
                label: t('leaderboard.combinedView'),
                icon: <ListIcon size={14} />,
              },
              {
                value: 'groups',
                label: t('leaderboard.byGroup'),
                icon: <UsersIcon size={14} />,
              },
            ]}
          />
        </div>
      </Controls>

      {scored.length === 0 ? (
        <Card>
          <EmptyState icon={TrophyIcon} title={t('leaderboard.noData')} />
        </Card>
      ) : view === 'groups' ? (
        <>
          <Muted $size="13px" style={{ marginBottom: 14 }}>
            {t('leaderboard.groupBoards')}
          </Muted>
          <Grid $min="290px">
            {groupBoards.map(({ group: item, rows: groupRows }, index) => (
              <GroupBoardCard
                key={item.id}
                group={item}
                rows={groupRows}
                delay={Math.min(index * 0.06, 0.4)}
              />
            ))}
          </Grid>
        </>
      ) : (
        <Stack $gap={4}>
          <TopBand>
            <PodiumCard>
              <Row $justify="space-between" style={{ marginBottom: 6, position: 'relative' }}>
                <SectionTitle>
                  <TrophyIcon size={18} /> {t('leaderboard.podium')}
                </SectionTitle>
                {daysLeft !== null && (
                  <Badge $tone="primary">
                    {daysLeft === 0
                      ? t('leaderboard.closesToday')
                      : t('leaderboard.closesIn', { count: daysLeft })}
                  </Badge>
                )}
              </Row>
              <div style={{ position: 'relative' }}>
                <Podium rows={rows} />
              </div>
            </PodiumCard>

            <Card>
              <SectionTitle style={{ marginBottom: 10 }}>
                <ChartIcon size={17} />{' '}
                {period === 'all' ? t('common.allTime') : labelForPeriod(period, anchor, locale)}
              </SectionTitle>
              {period === 'all' ? (
                <Muted $size="13px">{t('leaderboard.combined')}</Muted>
              ) : (
                <Sparkline
                  data={series}
                  height={84}
                  color={group?.color || gradeColor(average, tone)}
                  showAxis
                  passMark={settings.passMark}
                />
              )}
              <Facts>
                <Fact>
                  <b style={{ color: gradeColor(average, tone) }}>{average || '—'}</b>
                  <span>{t('common.average')}</span>
                </Fact>
                <Fact>
                  <b>{periodMarks.length}</b>
                  <span>{t('leaderboard.marks')}</span>
                </Fact>
                <Fact>
                  <b>{passRate}%</b>
                  <span>{t('dashboard.statPassRate')}</span>
                </Fact>
                <Fact>
                  <b>{best ? best.average : '—'}</b>
                  <span>{t('awards.rank1')}</span>
                </Fact>
              </Facts>
            </Card>
          </TopBand>

          <Card>
            <CardHead>
              <span className="chip">
                <ListIcon size={18} />
              </span>
              <div className="copy">
                <h2>{t('leaderboard.fullTable')}</h2>
                <p>{t('leaderboard.rankedBy')}</p>
              </div>
              <div className="action">
                <GradePill $color={gradeColor(average, tone)}>{average || '—'}</GradePill>
              </div>
            </CardHead>
            <StandingsTable
              rows={rows}
              color={group?.color}
              showGroup={!groupId}
              groupId={groupId || null}
              period={period}
              anchor={anchor}
            />
          </Card>
        </Stack>
      )}

      <ShareSheet open={shareOpen} group={group} onClose={() => setShareOpen(false)} />
    </>
  );
}
