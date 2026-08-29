'use client';

import { useMemo } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Field = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  border-radius: inherit;
`;

const Piece = styled(motion.span)`
  position: absolute;
  top: -14px;
  border-radius: 2px;
  will-change: transform, opacity;
`;

const PALETTE = ['#5B5BF0', '#F2547D', '#F0B429', '#12A87A', '#8A5BF0', '#0FA3C7'];

export default function Confetti({ count = 46, duration = 2.6 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        size: 6 + Math.random() * 7,
        color: PALETTE[index % PALETTE.length],
        delay: Math.random() * 0.9,
        drift: (Math.random() - 0.5) * 140,
        spin: 220 + Math.random() * 520,
        round: Math.random() > 0.6,
      })),
    [count]
  );

  return (
    <Field aria-hidden="true">
      {pieces.map((piece) => (
        <Piece
          key={piece.id}
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size * (piece.round ? 1 : 1.7),
            background: piece.color,
            borderRadius: piece.round ? '50%' : 2,
          }}
          initial={{ y: -20, opacity: 0, rotate: 0 }}
          animate={{
            y: ['0%', '420%'],
            x: [0, piece.drift],
            rotate: piece.spin,
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration,
            delay: piece.delay,
            ease: 'easeIn',
            times: [0, 0.1, 0.75, 1],
          }}
        />
      ))}
    </Field>
  );
}
