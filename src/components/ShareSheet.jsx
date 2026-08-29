'use client';

import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/lib/i18n';
import {
  buildLeaderboard,
  computeStreak,
  dailySeries,
  starsForStudent,
} from '@/lib/calc';
import { labelForPeriod, periodRange, todayKey } from '@/lib/dates';
import Modal from './Modal';
import Sparkline from './Sparkline';
import PersonAvatar from './PersonAvatar';
import { Button, Muted, Row, Stack } from './ui';
import { Segmented } from './Fields';
import { CopyIcon, PrinterIcon, ShareIcon } from './Icons';

const Preview = styled.div`
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  padding: 18px;

  .head {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .avatar {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    font-size: 24px;
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
  }

  .name { font-size: 16px; font-weight: 750; letter-spacing: -0.01em; }
  .sub { font-size: 12px; color: ${({ theme }) => theme.colors.textFaint}; margin-top: 2px; }

  .metrics {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-top: 16px;
  }

  .metric {
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    padding: 10px 8px;
    text-align: center;
  }

  .metric b {
    display: block;
    font-size: 17px;
    font-weight: 800;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }

  .metric span {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${({ theme }) => theme.colors.textFaint};
  }
`;

const TextBox = styled.pre`
  margin-top: 14px;
  padding: 13px 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 13px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
  color: ${({ theme }) => theme.colors.textSoft};
  max-height: 190px;
  overflow-y: auto;
`;

function printReport(html, title) {
  const frame = window.open('', '_blank', 'width=760,height=900');
  if (!frame) return;
  frame.document.write(`<!doctype html><html><head><meta charset="utf-8" />
    <title>${title}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: 'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif;
        margin: 0; padding: 40px; color: #141A2E; background: #fff;
      }
      .card { max-width: 620px; margin: 0 auto; border: 1px solid #E3E6F0; border-radius: 22px; padding: 30px; }
      .brand { font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: #8A92A9; font-weight: 700; }
      h1 { font-size: 25px; margin: 8px 0 2px; letter-spacing: -.02em; }
      .sub { color: #59617C; font-size: 14px; }
      .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 26px 0; }
      .metric { border: 1px solid #E3E6F0; border-radius: 14px; padding: 14px 10px; text-align: center; }
      .metric b { display: block; font-size: 21px; letter-spacing: -.02em; }
      .metric span { font-size: 10px; text-transform: uppercase; letter-spacing: .07em; color: #8A92A9; }
      ul { padding: 0; margin: 0; list-style: none; }
      li { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #EDEFF8; font-size: 14px; }
      li:last-child { border-bottom: 0; }
      .rank { color: #8A92A9; width: 26px; display: inline-block; font-weight: 700; }
      footer { margin-top: 26px; padding-top: 16px; border-top: 1px solid #E3E6F0; display: flex; justify-content: space-between; font-size: 12px; color: #8A92A9; }
      @media print { body { padding: 0; } .card { border: 0; } }
    </style></head><body>${html}</body></html>`);
  frame.document.close();
  frame.focus();
  window.setTimeout(() => frame.print(), 320);
}

export default function ShareSheet({ open, onClose, student, group }) {
  const { state, settings, toast } = useApp();
  const { t, locale } = useI18n();
  const [period, setPeriod] = useState('week');
  const today = todayKey();

  const report = useMemo(() => {
    if (!open) return null;
    const { from, to } = periodRange(period, today);
    const scopeGroup =
      group || state.groups.find((item) => item.id === student?.groupId) || null;
    const scopeName = scopeGroup ? scopeGroup.name : t('leaderboard.combined');

    const rows = buildLeaderboard({
      students: state.students,
      entries: state.entries,
      groupId: scopeGroup ? scopeGroup.id : null,
      period,
      anchor: today,
      passMark: settings.passMark,
    });

    if (student) {
      const row = rows.find((item) => item.student.id === student.id);
      const streak = computeStreak(state.entries, student.id, {
        skipWeekends: settings.skipWeekends,
        passMark: settings.passMark,
      });
      const stars = starsForStudent(state.awards, student.id);
      const lines = [
        t('share.line1', {
          name: student.name,
          average: row ? row.average : 0,
          count: row ? row.count : 0,
          period:
            period === 'week'
              ? t('common.week').toLowerCase()
              : t('common.month').toLowerCase(),
        }),
        t('share.line2', {
          rank: row ? row.rank : rows.length,
          total: rows.length,
          group: scopeName,
        }),
        t('share.line3', { streak: streak.current }),
        t('share.line4', { stars }),
      ];
      if (settings.teacherName) lines.push(t('share.signature', { teacher: settings.teacherName }));

      return {
        kind: 'student',
        title: t('share.reportFor', { name: student.name }),
        subtitle: `${scopeName} · ${labelForPeriod(period, today, locale)}`,
        metrics: [
          { value: row ? row.average : 0, label: t('common.average') },
          { value: row ? `#${row.rank}` : '—', label: t('common.rank') },
          { value: streak.current, label: t('common.days') },
          { value: stars, label: t('common.stars') },
        ],
        series: dailySeries(state.entries, from, to, student.id),
        text: [t('share.reportFor', { name: student.name }), '', ...lines].join('\n'),
        rows: [],
      };
    }

    const scored = rows.filter((row) => row.graded);
    const marks = scored.reduce((sum, row) => sum + row.count, 0);
    const average = marks
      ? Math.round((scored.reduce((sum, row) => sum + row.sum, 0) / marks) * 10) / 10
      : 0;
    const text = [
      t('share.groupReport', { name: scopeName }),
      labelForPeriod(period, today, locale),
      '',
      ...scored.map(
        (row, index) => `${index + 1}. ${row.student.name} — ${row.average} / 100`
      ),
      settings.teacherName ? `\n${t('share.signature', { teacher: settings.teacherName })}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      kind: 'group',
      title: t('share.groupReport', { name: scopeName }),
      subtitle: labelForPeriod(period, today, locale),
      metrics: [
        { value: average, label: t('common.average') },
        { value: rows.length, label: t('common.students') },
        { value: marks, label: t('leaderboard.marks') },
        {
          value: state.awards
            .filter((award) => (scopeGroup ? award.groupId === scopeGroup.id : true))
            .reduce((sum, award) => sum + award.stars, 0),
          label: t('common.stars'),
        },
      ],
      series: dailySeries(
        scopeGroup
          ? state.entries.filter((entry) => entry.groupId === scopeGroup.id)
          : state.entries,
        from,
        to
      ),
      text,
      rows: scored,
    };
  }, [open, period, student, group, state, settings, t, locale, today]);

  if (!report) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report.text);
      toast(t('common.copied'));
    } catch (error) {
      toast(t('common.copy'), 'danger');
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: report.title, text: report.text });
      } catch (error) {
        /* the user dismissed the share sheet */
      }
    } else {
      copy();
    }
  };

  const print = () => {
    const metrics = report.metrics
      .map((metric) => `<div class="metric"><b>${metric.value}</b><span>${metric.label}</span></div>`)
      .join('');
    const list = report.rows.length
      ? `<ul>${report.rows
          .map(
            (row, index) =>
              `<li><span><span class="rank">${index + 1}.</span>${row.student.name}</span><b>${row.average}</b></li>`
          )
          .join('')}</ul>`
      : '';
    printReport(
      `<div class="card">
        <div class="brand">${t('app.name')}</div>
        <h1>${report.title}</h1>
        <div class="sub">${report.subtitle}</div>
        <div class="metrics">${metrics}</div>
        ${list}
        <footer><span>${settings.teacherName || ''}</span><span>${t('share.generatedBy')}</span></footer>
      </div>`,
      report.title
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={t('share.title')} description={t('share.subtitle')}>
      <Stack $gap={4}>
        <div style={{ alignSelf: 'flex-start' }}>
          <Segmented
            name="share-period"
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'week', label: t('common.week') },
              { value: 'month', label: t('common.month') },
            ]}
          />
        </div>

        <Preview>
          <div className="head">
            {student ? (
              <PersonAvatar student={student} size={46} />
            ) : (
              <span className="avatar">{group?.emoji || '#'}</span>
            )}
            <div>
              <div className="name">{report.title}</div>
              <div className="sub">{report.subtitle}</div>
            </div>
          </div>
          <div className="metrics">
            {report.metrics.map((metric) => (
              <div className="metric" key={metric.label}>
                <b>{metric.value}</b>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <Sparkline data={report.series} height={52} />
          </div>
        </Preview>

        <div>
          <Muted $size="12.5px">{t('share.period')}: {report.subtitle}</Muted>
          <TextBox>{report.text}</TextBox>
        </div>

        <Row $gap={2} $wrap>
          <Button $variant="primary" onClick={share}>
            <ShareIcon size={16} />
            {t('share.shareNow')}
          </Button>
          <Button onClick={copy}>
            <CopyIcon size={16} />
            {t('share.copyText')}
          </Button>
          <Button onClick={print}>
            <PrinterIcon size={16} />
            {t('share.printCard')}
          </Button>
        </Row>
      </Stack>
    </Modal>
  );
}
