'use client';

import styled from 'styled-components';
import { motion } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber';
import { Card, Eyebrow } from './ui';
import { TrendDownIcon, TrendUpIcon } from './Icons';

const Shell = styled(motion(Card))`
  padding: 18px;
  overflow: hidden;
  /* The cards sit in a grid where some carry a caption and some do not, so
     they stretch to the tallest and the caption is pinned to the floor.
     Otherwise a row reads as four unrelated cards instead of one set. */
  height: 100%;
  display: flex;
  flex-direction: column;

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .icon {
    width: 34px;
    height: 34px;
    border-radius: 11px;
    display: grid;
    place-items: center;
    color: ${({ $tint, theme }) => $tint || theme.colors.primary};
    background: ${({ $tint, theme }) => `${$tint || theme.colors.primary}1A`};
  }

  /* The value line: the leading digits carry the weight, the fraction and
     the unit step back — the way a dashboard number wants to be read. */
  .value {
    display: flex;
    align-items: baseline;
    gap: 2px;
    margin-top: 13px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.035em;
    color: ${({ $tint, theme }) => ($tint ? theme.colors.text : theme.colors.text)};
  }

  .value b {
    font-size: clamp(26px, 3.6vw, 32px);
    font-weight: 800;
  }

  .value i {
    font-style: normal;
    font-size: 19px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textFaint};
  }

  .value em {
    font-style: normal;
    margin-left: 5px;
    font-size: 13px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textFaint};
  }

  .caption {
    margin-top: auto;
    padding-top: 10px;
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textFaint};
  }
`;

const Trend = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $up }) => ($up ? theme.colors.success : theme.colors.danger)};
  background: ${({ theme, $up }) => ($up ? theme.colors.successSoft : theme.colors.dangerSoft)};
`;

/**
 * One number, told well. `value` may carry a fraction (an average out of a
 * hundred usually does) and it is split so the decimal reads as a detail.
 */
export default function StatCard({
  label,
  value,
  icon,
  caption,
  tint,
  suffix,
  trend,
  delay = 0,
}) {
  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? numeric : 0;
  const whole = Math.trunc(safe);
  const fraction = Math.round((safe - whole) * 10);

  return (
    <Shell
      $tint={tint}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="top">
        <Eyebrow>{label}</Eyebrow>
        {icon && <span className="icon">{icon}</span>}
      </div>
      <div className="value">
        <b>
          <AnimatedNumber value={whole} />
        </b>
        {fraction > 0 && <i>.{fraction}</i>}
        {suffix && <em>{suffix}</em>}
      </div>
      {(caption || trend !== undefined) && (
        <div className="caption">
          {trend !== undefined && trend !== null && trend !== 0 && (
            <Trend $up={trend > 0}>
              {trend > 0 ? <TrendUpIcon size={11} /> : <TrendDownIcon size={11} />}
              {Math.abs(trend)}
            </Trend>
          )}
          {caption && <span>{caption}</span>}
        </div>
      )}
    </Shell>
  );
}
