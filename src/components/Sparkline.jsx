'use client';

import { useId } from 'react';
import styled, { useTheme } from 'styled-components';
import { motion } from 'framer-motion';

const Wrap = styled.div`
  width: 100%;
  svg {
    display: block;
    width: 100%;
    height: ${({ $height }) => `${$height}px`};
  }
`;

/**
 * A compact area chart of average marks. The vertical axis is always the full
 * hundred, so two charts side by side can be read against each other, and
 * days without a mark are skipped rather than drawn as a zero.
 */
export default function Sparkline({
  data,
  height = 56,
  color,
  showAxis = false,
  passMark = null,
}) {
  const theme = useTheme();
  const gradientId = useId();
  const stroke = color || theme.colors.primary;

  const graded = (data || []).filter((point) => point.count > 0);
  if (!data || data.length < 2 || graded.length < 2) return <Wrap $height={height} />;

  const width = 300;
  const pad = 5;
  const stepX = width / (data.length - 1);
  const toY = (value) => pad + (1 - Math.min(Math.max(value, 0), 100) / 100) * (height - pad * 2);

  const points = data
    .map((point, index) => (point.count > 0 ? [index * stepX, toY(point.value)] : null))
    .filter(Boolean);

  const line = points
    .map(([x, y], index) => {
      if (index === 0) return `M ${x} ${y}`;
      const [px, py] = points[index - 1];
      const cx = (px + x) / 2;
      return `C ${cx} ${py} ${cx} ${y} ${x} ${y}`;
    })
    .join(' ');

  const first = points[0];
  const last = points[points.length - 1];
  const area = `${line} L ${last[0]} ${height} L ${first[0]} ${height} Z`;

  return (
    <Wrap $height={height}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.34" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {showAxis && (
          <line
            x1="0"
            y1={height - 1}
            x2={width}
            y2={height - 1}
            stroke={theme.colors.border}
            strokeWidth="1"
          />
        )}

        {passMark !== null && (
          <line
            x1="0"
            y1={toY(passMark)}
            x2={width}
            y2={toY(passMark)}
            stroke={theme.colors.borderStrong}
            strokeWidth="1"
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
        )}

        <motion.path
          d={area}
          fill={`url(#${gradientId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
    </Wrap>
  );
}
