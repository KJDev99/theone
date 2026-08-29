'use client';

import styled, { css, keyframes } from 'styled-components';

export const media = {
  xs: (...args) => css`@media (max-width: 480px) { ${css(...args)} }`,
  sm: (...args) => css`@media (max-width: 640px) { ${css(...args)} }`,
  md: (...args) => css`@media (max-width: 860px) { ${css(...args)} }`,
  lg: (...args) => css`@media (max-width: 1100px) { ${css(...args)} }`,
  up: (...args) => css`@media (min-width: 861px) { ${css(...args)} }`,
};

export const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
`;

export const pop = keyframes`
  0% { transform: scale(0.85); opacity: 0; }
  60% { transform: scale(1.04); }
  100% { transform: scale(1); opacity: 1; }
`;

export const shimmer = keyframes`
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap = 4, theme }) => theme.space($gap)};
  ${({ $align }) => $align && css`align-items: ${$align};`}
`;

export const Row = styled.div`
  display: flex;
  align-items: ${({ $align = 'center' }) => $align};
  justify-content: ${({ $justify = 'flex-start' }) => $justify};
  gap: ${({ $gap = 3, theme }) => theme.space($gap)};
  ${({ $wrap }) => $wrap && css`flex-wrap: wrap;`}
`;

export const Grid = styled.div`
  display: grid;
  gap: ${({ $gap = 4, theme }) => theme.space($gap)};
  grid-template-columns: repeat(auto-fill, minmax(${({ $min = '260px' }) => $min}, 1fr));
`;

export const Card = styled.div`
  position: relative;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ $pad = 5, theme }) => theme.space($pad)};
  box-shadow: ${({ theme }) => theme.shadow.sm};
  transition: transform 260ms ${({ theme }) => theme.ease.out},
    box-shadow 260ms ${({ theme }) => theme.ease.out},
    border-color 200ms ease, background-color 260ms ease;

  ${({ $hover, theme }) =>
    $hover &&
    css`
      cursor: pointer;
      &:hover {
        transform: translateY(-3px);
        box-shadow: ${theme.shadow.md};
        border-color: ${theme.colors.borderStrong};
      }
    `}

  ${media.sm`
    padding: 16px;
    border-radius: 18px;
  `}
`;

export const SectionTitle = styled.h2`
  font-size: ${({ $size = '17px' }) => $size};
  font-weight: 700;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const Muted = styled.p`
  color: ${({ theme }) => theme.colors.textSoft};
  font-size: ${({ $size = '14px' }) => $size};
  line-height: 1.55;
`;

export const Eyebrow = styled.span`
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-size: 11px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textFaint};
`;

const variants = {
  primary: css`
    background: ${({ theme }) => theme.gradient.brand};
    color: #fff;
    border-color: transparent;
    box-shadow: ${({ theme }) => theme.shadow.glow};
    &:hover:not(:disabled) { filter: brightness(1.06); }
  `,
  solid: css`
    background: ${({ theme }) => theme.colors.text};
    color: ${({ theme }) => theme.colors.surface};
    border-color: transparent;
  `,
  soft: css`
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.primary};
    border-color: transparent;
    &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.primary}22; }
  `,
  outline: css`
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
    border-color: ${({ theme }) => theme.colors.border};
    &:hover:not(:disabled) {
      border-color: ${({ theme }) => theme.colors.borderStrong};
      background: ${({ theme }) => theme.colors.surfaceAlt};
    }
  `,
  ghost: css`
    background: transparent;
    color: ${({ theme }) => theme.colors.textSoft};
    border-color: transparent;
    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.surfaceAlt};
      color: ${({ theme }) => theme.colors.text};
    }
  `,
  danger: css`
    background: ${({ theme }) => theme.colors.dangerSoft};
    color: ${({ theme }) => theme.colors.danger};
    border-color: transparent;
    &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.danger}26; }
  `,
};

const sizes = {
  sm: css`height: 34px; padding: 0 12px; font-size: 13px; border-radius: 10px;`,
  md: css`height: 42px; padding: 0 16px; font-size: 14px; border-radius: 13px;`,
  lg: css`height: 50px; padding: 0 22px; font-size: 15px; border-radius: 16px;`,
};

export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid transparent;
  transition: transform 140ms ${({ theme }) => theme.ease.spring},
    background-color 180ms ease, filter 180ms ease, border-color 180ms ease,
    color 180ms ease, box-shadow 180ms ease;

  ${({ $size = 'md' }) => sizes[$size]}
  ${({ $variant = 'outline' }) => variants[$variant] || variants.outline}
  ${({ $full }) => $full && css`width: 100%;`}

  &:active:not(:disabled) { transform: scale(0.96); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export const IconButton = styled(Button)`
  padding: 0;
  width: ${({ $size = 'md' }) => ($size === 'sm' ? '34px' : $size === 'lg' ? '50px' : '42px')};
  flex: none;
`;

const badgeTones = {
  default: css`
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.textSoft};
  `,
  primary: css`
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.primary};
  `,
  success: css`
    background: ${({ theme }) => theme.colors.successSoft};
    color: ${({ theme }) => theme.colors.success};
  `,
  warning: css`
    background: ${({ theme }) => theme.colors.warningSoft};
    color: ${({ theme }) => theme.colors.warning};
  `,
  danger: css`
    background: ${({ theme }) => theme.colors.dangerSoft};
    color: ${({ theme }) => theme.colors.danger};
  `,
  star: css`
    background: ${({ theme }) => theme.colors.warningSoft};
    color: ${({ theme }) => theme.colors.star};
  `,
  streak: css`
    background: ${({ theme }) => theme.colors.streak}1F;
    color: ${({ theme }) => theme.colors.streak};
  `,
};

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: ${({ $size = '24px' }) => $size};
  padding: 0 9px;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.01em;
  white-space: nowrap;
  ${({ $tone = 'default' }) => badgeTones[$tone] || badgeTones.default}
`;

export const Divider = styled.hr`
  border: 0;
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  margin: ${({ $my = 4, theme }) => `${theme.space($my)} 0`};
`;

export const Avatar = styled.div`
  width: ${({ $size = 44 }) => `${$size}px`};
  height: ${({ $size = 44 }) => `${$size}px`};
  flex: none;
  border-radius: ${({ theme }) => theme.radius.md};
  display: grid;
  place-items: center;
  font-size: ${({ $size = 44 }) => `${Math.round($size * 0.46)}px`};
  background: ${({ theme, $color }) =>
    $color ? `${$color}1F` : theme.colors.surfaceAlt};
  border: 1px solid ${({ theme, $color }) => ($color ? `${$color}33` : theme.colors.border)};
  user-select: none;
`;

export const Scroller = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 0 -4px;
  padding: 0 4px 4px;
  &::-webkit-scrollbar { height: 6px; }
`;

export const Skeleton = styled.div`
  border-radius: ${({ theme }) => theme.radius.md};
  height: ${({ $h = '16px' }) => $h};
  width: ${({ $w = '100%' }) => $w};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  background-image: linear-gradient(
    90deg,
    transparent 0,
    ${({ theme }) => theme.colors.border} 40%,
    transparent 80%
  );
  background-size: 400px 100%;
  animation: ${shimmer} 1.4s infinite linear;
`;

export const Empty = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.space(10)} ${({ theme }) => theme.space(5)};
  color: ${({ theme }) => theme.colors.textFaint};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;

  span[role='img'] { font-size: 34px; }
`;

export const PageHeader = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(4)};
  flex-wrap: wrap;
  margin-bottom: ${({ theme }) => theme.space(6)};

  h1 {
    font-size: clamp(24px, 4vw, 32px);
    font-weight: 800;
    letter-spacing: -0.025em;
  }
`;

export const Tabs = styled.div`
  display: inline-flex;
  padding: 4px;
  gap: 3px;
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.pill};
`;

export const Tab = styled.button`
  position: relative;
  height: 34px;
  padding: 0 16px;
  border: 0;
  background: transparent;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: 13px;
  font-weight: 650;
  color: ${({ theme, $active }) => ($active ? theme.colors.text : theme.colors.textSoft)};
  transition: color 180ms ease;
  z-index: 1;
  white-space: nowrap;

  &:hover { color: ${({ theme }) => theme.colors.text}; }
`;

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
`;

export const Hint = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textFaint};
  line-height: 1.5;
`;

/**
 * The header strip every card uses: an icon chip, a title, an optional line of
 * explanation and an action pushed to the right.
 */
export const CardHead = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: ${({ $gap = 16 }) => `${$gap}px`};

  > .chip {
    flex: none;
    width: 36px;
    height: 36px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    color: ${({ theme, $tint }) => $tint || theme.colors.primary};
    background: ${({ theme, $tint }) => `${$tint || theme.colors.primary}16`};
  }

  > .copy {
    flex: 1;
    min-width: 0;
  }

  h2, h3 {
    font-size: 15.5px;
    font-weight: 750;
    letter-spacing: -0.01em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  p {
    margin-top: 2px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textFaint};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  > .action {
    flex: none;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

/** A quieter box for content nested inside a card. */
export const Sheet = styled.div`
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  padding: ${({ $pad = 14 }) => `${$pad}px`};
`;

/** One mark, coloured by how good it is. Used in tables, lists and cards. */
export const GradePill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: ${({ $size = 'md' }) => ($size === 'sm' ? '38px' : '46px')};
  height: ${({ $size = 'md' }) => ($size === 'sm' ? '24px' : '30px')};
  padding: 0 ${({ $size = 'md' }) => ($size === 'sm' ? '8px' : '10px')};
  border-radius: 9px;
  font-size: ${({ $size = 'md' }) => ($size === 'sm' ? '12px' : '13.5px')};
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}1A`};
  border: 1px solid ${({ $color }) => `${$color}2E`};
`;

/** A number where the fractional part steps back, as on a finance dashboard. */
export const BigNumber = styled.span`
  display: inline-flex;
  align-items: baseline;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.035em;
  line-height: 1;

  b {
    font-size: ${({ $size = '32px' }) => $size};
    font-weight: 800;
  }

  i {
    font-style: normal;
    font-size: ${({ $size = '32px' }) => `calc(${$size} * 0.62)`};
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textFaint};
  }

  em {
    font-style: normal;
    margin-left: 6px;
    font-size: ${({ $size = '32px' }) => `calc(${$size} * 0.42)`};
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textFaint};
  }
`;
