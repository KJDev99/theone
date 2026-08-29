'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { CheckIcon, XIcon } from './Icons';
import { media } from './ui';

const Stack = styled.div`
  position: fixed;
  z-index: 120;
  right: 22px;
  bottom: 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;

  ${media.md`
    right: 12px;
    left: 12px;
    bottom: calc(78px + env(safe-area-inset-bottom));
  `}
`;

const Item = styled(motion.div)`
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
  max-width: 380px;
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadow.md};
  font-size: 13.5px;
  font-weight: 600;

  .dot {
    width: 26px;
    height: 26px;
    flex: none;
    border-radius: 9px;
    display: grid;
    place-items: center;
    background: ${({ theme, $tone }) =>
      $tone === 'danger' ? theme.colors.dangerSoft : theme.colors.successSoft};
    color: ${({ theme, $tone }) =>
      $tone === 'danger' ? theme.colors.danger : theme.colors.success};
  }

  button {
    margin-left: auto;
    background: none;
    border: 0;
    color: ${({ theme }) => theme.colors.textFaint};
    display: grid;
    place-items: center;
    padding: 4px;
    border-radius: 8px;
    &:hover { color: ${({ theme }) => theme.colors.text}; }
  }
`;

export default function Toasts() {
  const { toasts, dismissToast } = useApp();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <Stack>
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <Item
            key={toast.id}
            $tone={toast.tone}
            layout
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <span className="dot">
              {toast.tone === 'danger' ? <XIcon size={15} /> : <CheckIcon size={15} />}
            </span>
            <span>{toast.message}</span>
            <button type="button" onClick={() => dismissToast(toast.id)} aria-label="Dismiss">
              <XIcon size={14} />
            </button>
          </Item>
        ))}
      </AnimatePresence>
    </Stack>,
    document.body
  );
}
