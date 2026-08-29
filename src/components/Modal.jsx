'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { IconButton, Row, media } from './ui';
import { XIcon } from './Icons';

const Backdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 90;
  background: ${({ theme }) => theme.colors.overlay};
  backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  padding: 24px;

  ${media.sm`
    padding: 0;
    place-items: end stretch;
  `}
`;

const Panel = styled(motion.div)`
  width: 100%;
  max-width: ${({ $width = '520px' }) => $width};
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadow.lg};
  padding: 24px;

  ${media.sm`
    max-width: none;
    max-height: 92vh;
    border-radius: 24px 24px 0 0;
    padding: 20px 16px calc(20px + env(safe-area-inset-bottom));
  `}
`;

const Header = styled(Row)`
  margin-bottom: 18px;

  h2 {
    font-size: 19px;
    font-weight: 750;
    letter-spacing: -0.02em;
  }

  p {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textSoft};
    margin-top: 3px;
  }
`;

const Handle = styled.div`
  display: none;
  width: 38px;
  height: 4px;
  border-radius: 99px;
  background: ${({ theme }) => theme.colors.borderStrong};
  margin: 0 auto 14px;

  ${media.sm`display: block;`}
`;

export default function Modal({
  open,
  onClose,
  title,
  description,
  width,
  children,
  footer,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <Backdrop
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <Panel
            $width={width}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 22, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <Handle />
            <Header $justify="space-between" $align="flex-start">
              <div>
                <h2>{title}</h2>
                {description && <p>{description}</p>}
              </div>
              <IconButton $variant="ghost" $size="sm" onClick={onClose} aria-label="Close">
                <XIcon size={17} />
              </IconButton>
            </Header>
            {children}
            {footer && <Row $justify="flex-end" $gap={2} style={{ marginTop: 20 }}>{footer}</Row>}
          </Panel>
        </Backdrop>
      )}
    </AnimatePresence>,
    document.body
  );
}
