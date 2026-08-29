'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useApp } from '@/context/AppContext';
import { gradeColor } from '@/lib/levels';
import PersonAvatar from './PersonAvatar';
import { media } from './ui';
import { CrownIcon } from './Icons';

const Stage = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: end;
  gap: 14px;
  padding-top: 18px;

  ${media.xs`gap: 8px;`}
`;

const Slot = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  order: ${({ $rank }) => ($rank === 1 ? 2 : $rank === 2 ? 1 : 3)};
  min-width: 0;
  width: 100%;
`;

const Person = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  text-align: center;

  .name {
    font-size: 13px;
    font-weight: 700;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .points {
    display: inline-flex;
    align-items: baseline;
    gap: 3px;
    font-size: 12px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textSoft};

    b { font-size: 15px; color: ${({ theme }) => theme.colors.text}; }
  }

  &:hover .name { color: ${({ theme }) => theme.colors.primary}; }
`;

const Portrait = styled.div`
  position: relative;

  .medal {
    position: absolute;
    right: -7px;
    bottom: -7px;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 11.5px;
    font-weight: 800;
    color: #2a1c00;
    background: ${({ $color }) => $color};
    border: 2.5px solid ${({ theme }) => theme.colors.surface};
  }

  .crown {
    position: absolute;
    top: -17px;
    left: 50%;
    transform: translateX(-50%);
    color: ${({ $color }) => $color};
  }
`;

const Block = styled(motion.div)`
  position: relative;
  width: 100%;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  background: ${({ $color }) => `linear-gradient(180deg, ${$color}, ${$color}33)`};

  &::after {
    content: '${({ $place }) => $place}';
    position: absolute;
    inset: 0;
    display: grid;
    place-items: start center;
    padding-top: 9px;
    font-size: 17px;
    font-weight: 800;
    color: rgba(30, 20, 0, 0.55);
  }
`;

const HEIGHTS = { 1: 104, 2: 76, 3: 56 };
const COLORS = { 1: '#F5C451', 2: '#C8D2DE', 3: '#D89A67' };

export default function Podium({ rows }) {
  const { t } = useI18n();
  const { settings } = useApp();
  const tone = { passMark: settings.passMark, excellentMark: settings.excellentMark };
  const top = rows.filter((row) => row.graded).slice(0, 3);

  if (top.length === 0) return null;

  return (
    <Stage>
      {top.map((row, index) => {
        const place = index + 1;
        return (
          <Slot
            key={row.student.id}
            $rank={place}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * (3 - place), duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Person href={`/students/${row.student.id}`}>
              <Portrait $color={COLORS[place]}>
                {place === 1 && (
                  <motion.span
                    className="crown"
                    initial={{ opacity: 0, y: 6, rotate: -12 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{ delay: 0.42, type: 'spring', stiffness: 300, damping: 14 }}
                  >
                    <CrownIcon size={20} filled />
                  </motion.span>
                )}
                <PersonAvatar
                  student={row.student}
                  size={place === 1 ? 62 : 50}
                  ring={COLORS[place]}
                  glow={place === 1}
                />
                <span className="medal">{place}</span>
              </Portrait>
              <span className="name">{row.student.name}</span>
              <span className="points" style={{ color: gradeColor(row.average, tone) }}>
                <b style={{ color: 'inherit' }}>{row.average}</b>
                {t('common.outOf')}
              </span>
            </Person>
            <Block
              $color={COLORS[place]}
              $place={place}
              initial={{ height: 0 }}
              animate={{ height: HEIGHTS[place] }}
              transition={{
                delay: 0.14 * (3 - place),
                type: 'spring',
                stiffness: 140,
                damping: 20,
              }}
            />
          </Slot>
        );
      })}
    </Stage>
  );
}
