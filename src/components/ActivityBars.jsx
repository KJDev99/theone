'use client';

import styled from 'styled-components';
import { motion } from 'framer-motion';
import { formatShortDate, isWeekend } from '@/lib/dates';
import { useI18n } from '@/lib/i18n';
import { useApp } from '@/context/AppContext';
import { gradeColor } from '@/lib/levels';

const Row = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: ${({ $height }) => `${$height}px`};
  width: 100%;
`;

const Column = styled.div`
  flex: 1 1 0;
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: flex-end;
  border-radius: 5px;
  background: ${({ theme, $weekend }) =>
    $weekend ? theme.colors.surfaceAlt : 'transparent'};
`;

const Bar = styled(motion.div)`
  width: 100%;
  border-radius: 5px;
  min-height: 3px;
  background: ${({ theme, $color }) => $color || theme.colors.primary};
  opacity: ${({ $empty }) => ($empty ? 0.16 : 1)};
`;

/** The pass mark, drawn across the chart so a dip is obvious. */
const PassLine = styled.span`
  position: absolute;
  left: 0;
  right: 0;
  height: 0;
  border-top: 1px dashed ${({ theme }) => theme.colors.borderStrong};
  bottom: ${({ $at }) => `${$at}%`};
  pointer-events: none;
`;

const Frame = styled.div`
  position: relative;
  width: 100%;
`;

/** Day-by-day bars — the quickest read of whether a student is consistent. */
export default function ActivityBars({ data, height = 74, color }) {
  const { locale } = useI18n();
  const { settings } = useApp();
  const tone = { passMark: settings.passMark, excellentMark: settings.excellentMark };

  return (
    <Frame>
      <Row $height={height} role="img" aria-label="Daily marks">
        {data.map((point, index) => {
          const graded = point.count > 0;
          return (
            <Column key={point.date} $weekend={isWeekend(point.date)}>
              <Bar
                $color={graded ? color || gradeColor(point.value, tone) : undefined}
                $empty={!graded}
                initial={{ height: 0 }}
                animate={{ height: `${graded ? Math.max(point.value, 8) : 4}%` }}
                transition={{
                  delay: Math.min(index * 0.012, 0.4),
                  type: 'spring',
                  stiffness: 220,
                  damping: 24,
                }}
                title={`${formatShortDate(point.date, locale)}: ${
                  graded ? point.value : '—'
                }`}
              />
            </Column>
          );
        })}
      </Row>
      <PassLine $at={settings.passMark} />
    </Frame>
  );
}
