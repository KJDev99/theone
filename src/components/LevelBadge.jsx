'use client';

import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { levelFor } from '@/lib/levels';
import {
  AwardIcon,
  CrownIcon,
  GemIcon,
  MedalIcon,
  SproutIcon,
  TrophyIcon,
} from './Icons';

const LEVEL_ICONS = {
  sprout: SproutIcon,
  medal: MedalIcon,
  award: AwardIcon,
  trophy: TrophyIcon,
  gem: GemIcon,
  crown: CrownIcon,
};

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: ${({ $size }) => ($size === 'sm' ? '23px' : '29px')};
  padding: 0 ${({ $size }) => ($size === 'sm' ? '9px' : '12px')};
  border-radius: 999px;
  font-size: ${({ $size }) => ($size === 'sm' ? '11.5px' : '13px')};
  font-weight: 750;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}1F`};
  border: 1px solid ${({ $color }) => `${$color}2E`};
  white-space: nowrap;
`;

const Meter = styled.div`
  margin-top: 12px;

  .track {
    height: 8px;
    border-radius: 99px;
    background: ${({ theme }) => theme.colors.border};
    overflow: hidden;
  }

  .label {
    margin-top: 8px;
    font-size: 11.5px;
    color: ${({ theme }) => theme.colors.textFaint};
  }
`;

const Fill = styled(motion.div)`
  height: 100%;
  border-radius: 99px;
  background: ${({ $color }) => `linear-gradient(90deg, ${$color}99, ${$color})`};
`;

export default function LevelBadge({ average, size = 'md', showProgress = false }) {
  const { t } = useI18n();
  const { level, next, progress, toNext } = levelFor(average);
  const Icon = LEVEL_ICONS[level.icon] || SproutIcon;

  return (
    <span style={{ display: showProgress ? 'block' : 'inline-flex' }}>
      <Pill $color={level.color} $size={size}>
        <Icon size={size === 'sm' ? 13 : 15} />
        {t(`levels.${level.key}`)}
      </Pill>

      {showProgress && (
        <Meter>
          <div className="track">
            <Fill
              $color={level.color}
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(progress * 100)}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="label">
            {next
              ? t('levels.toNext', { count: toNext, level: t(`levels.${next.key}`) })
              : t('levels.max')}
          </div>
        </Meter>
      )}
    </span>
  );
}
