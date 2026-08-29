'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/lib/i18n';
import Confetti from './Confetti';
import PersonAvatar from './PersonAvatar';
import { Button } from './ui';
import { StarIcon } from './Icons';

const Backdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 130;
  display: grid;
  place-items: center;
  padding: 24px;
  background: ${({ theme }) => theme.colors.overlay};
  backdrop-filter: blur(8px);
`;

const Card = styled(motion.div)`
  position: relative;
  width: 100%;
  max-width: 380px;
  padding: 34px 26px 26px;
  text-align: center;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadow.lg};
  overflow: hidden;

  h2 {
    font-size: 23px;
    font-weight: 800;
    letter-spacing: -0.02em;
    background: ${({ theme }) => theme.gradient.brand};
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  p {
    margin-top: 8px;
    font-size: 14.5px;
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.textSoft};
  }
`;

const Emblem = styled(motion.div)`
  width: 88px;
  height: 88px;
  margin: 0 auto 18px;
  display: grid;
  place-items: center;
`;

const Stars = styled.div`
  display: inline-flex;
  gap: 4px;
  margin-top: 16px;
  color: ${({ theme }) => theme.colors.star};
`;

export default function Celebration() {
  const { celebration, setCelebration } = useApp();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!celebration) return undefined;
    const timer = window.setTimeout(() => setCelebration(null), 9000);
    return () => window.clearTimeout(timer);
  }, [celebration, setCelebration]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {celebration && (
        <Backdrop
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setCelebration(null)}
        >
          <Card
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <Confetti count={60} />
            <Emblem
              initial={{ scale: 0.4, rotate: -18 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 12, delay: 0.12 }}
            >
              <PersonAvatar student={celebration.student} size={88} />
            </Emblem>
            <h2>{t('awards.congrats')}</h2>
            <p>
              {t('awards.congratsBody', {
                name: celebration.student?.name,
                stars: celebration.stars,
              })}
            </p>
            <Stars>
              {Array.from({ length: Math.min(celebration.stars || 0, 8) }, (_, index) => (
                <motion.span
                  key={index}
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3 + index * 0.07, type: 'spring', stiffness: 300 }}
                  style={{ display: 'grid', placeItems: 'center' }}
                >
                  <StarIcon size={22} filled />
                </motion.span>
              ))}
            </Stars>
            <Button
              $variant="primary"
              $full
              style={{ marginTop: 22 }}
              onClick={() => setCelebration(null)}
            >
              {t('common.close')}
            </Button>
          </Card>
        </Backdrop>
      )}
    </AnimatePresence>,
    document.body
  );
}
