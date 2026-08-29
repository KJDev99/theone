'use client';

import styled from 'styled-components';
import { motion } from 'framer-motion';

const Grid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
`;

const EmojiChip = styled(motion.button).attrs({ type: 'button' })`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  font-size: 19px;
  display: grid;
  place-items: center;
  border: 1.5px solid
    ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.border)};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primarySoft : theme.colors.surfaceAlt};
  transition: border-color 160ms ease, background-color 160ms ease;
`;

const ColorChip = styled(motion.button).attrs({ type: 'button' })`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  border: 2.5px solid
    ${({ theme, $active, $color }) => ($active ? $color : theme.colors.surface)};
  box-shadow: 0 0 0 1.5px
    ${({ theme, $active, $color }) => ($active ? $color : theme.colors.border)};
`;

export function EmojiPicker({ options, value, onChange }) {
  return (
    <Grid>
      {options.map((emoji) => (
        <EmojiChip
          key={emoji}
          $active={value === emoji}
          onClick={() => onChange(emoji)}
          whileTap={{ scale: 0.88 }}
          aria-label={emoji}
          aria-pressed={value === emoji}
        >
          {emoji}
        </EmojiChip>
      ))}
    </Grid>
  );
}

export function ColorPicker({ options, value, onChange }) {
  return (
    <Grid>
      {options.map((color) => (
        <ColorChip
          key={color}
          $color={color}
          $active={value === color}
          onClick={() => onChange(color)}
          whileTap={{ scale: 0.85 }}
          aria-label={color}
          aria-pressed={value === color}
        />
      ))}
    </Grid>
  );
}
