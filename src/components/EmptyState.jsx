'use client';

import styled from 'styled-components';
import { motion } from 'framer-motion';
import { InboxIcon } from './Icons';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: ${({ $pad = 44 }) => `${$pad}px 20px`};
`;

const Glyph = styled(motion.span)`
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 18px;
  color: ${({ theme, $tint }) => $tint || theme.colors.textFaint};
  background: ${({ theme, $tint }) =>
    $tint ? `${$tint}18` : theme.colors.surfaceAlt};
  border: 1px solid
    ${({ theme, $tint }) => ($tint ? `${$tint}2B` : theme.colors.border)};
`;

const Title = styled.p`
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.text};
`;

const Body = styled.p`
  font-size: 13.5px;
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.textFaint};
  max-width: 42ch;
`;

/** One consistent shape for every "nothing here yet" moment in the app. */
export default function EmptyState({
  icon: Icon = InboxIcon,
  title,
  body,
  tint,
  action,
  pad,
}) {
  return (
    <Wrap $pad={pad}>
      <Glyph
        $tint={tint}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 20 }}
      >
        <Icon size={25} />
      </Glyph>
      {title && <Title>{title}</Title>}
      {body && <Body>{body}</Body>}
      {action}
    </Wrap>
  );
}
