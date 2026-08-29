'use client';

import styled from 'styled-components';
import { accentFor, gradientFor, initials } from '@/lib/identity';

const Tile = styled.span`
  position: relative;
  display: inline-grid;
  place-items: center;
  flex: none;
  width: ${({ $size }) => `${$size}px`};
  height: ${({ $size }) => `${$size}px`};
  border-radius: ${({ $size }) => `${Math.round($size * 0.32)}px`};
  background: ${({ $gradient }) => $gradient};
  color: #fff;
  font-weight: 800;
  font-size: ${({ $size }) => `${Math.max(Math.round($size * 0.38), 10)}px`};
  letter-spacing: 0.01em;
  line-height: 1;
  user-select: none;
  box-shadow: ${({ $glow, $shadow }) => ($glow ? `0 6px 18px ${$shadow}` : 'none')};

  ${({ $ring }) =>
    $ring &&
    `
    outline: 2px solid ${$ring};
    outline-offset: 2px;
  `}
`;

/**
 * A student's monogram tile. The colour is stable per student, so the same
 * face appears everywhere they show up on the board.
 */
export default function PersonAvatar({ student, size = 40, ring, glow = false, className }) {
  const accent = accentFor(student);

  return (
    <Tile
      className={className}
      $size={size}
      $gradient={gradientFor(student)}
      $ring={ring}
      $glow={glow}
      $shadow={`${accent.to}59`}
      aria-hidden="true"
    >
      {initials(student?.name)}
    </Tile>
  );
}
