'use client';

import styled, { keyframes } from 'styled-components';
import { FlameIcon } from './Icons';

const flicker = keyframes`
  0%, 100% { transform: scale(1) rotate(0deg); }
  30% { transform: scale(1.12) rotate(-4deg); }
  60% { transform: scale(0.97) rotate(3deg); }
`;

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: ${({ $size }) => ($size === 'sm' ? '22px' : '26px')};
  padding: 0 10px 0 8px;
  border-radius: 999px;
  font-size: ${({ $size }) => ($size === 'sm' ? '11.5px' : '12.5px')};
  font-weight: 750;
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $hot }) => ($hot ? '#fff' : theme.colors.streak)};
  background: ${({ theme, $hot }) =>
    $hot ? theme.gradient.warm : `${theme.colors.streak}1F`};
  box-shadow: ${({ theme, $hot }) => ($hot ? `0 4px 14px ${theme.colors.streak}55` : 'none')};

  svg {
    animation: ${flicker} 2.4s ease-in-out infinite;
  }
`;

export default function StreakBadge({ count, goal = 5, size = 'md' }) {
  if (!count) return null;
  const hot = count >= goal;
  return (
    <Chip $hot={hot} $size={size} title={`${count} day streak`}>
      <FlameIcon size={size === 'sm' ? 13 : 15} filled={hot} />
      {count}
    </Chip>
  );
}
