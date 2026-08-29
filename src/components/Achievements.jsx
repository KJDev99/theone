'use client';

import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import {
  CrownIcon,
  FlameIcon,
  GemIcon,
  MedalIcon,
  RocketIcon,
  ShieldIcon,
  StarIcon,
  TargetIcon,
  TrophyIcon,
  ZapIcon,
} from './Icons';
import { Muted } from './ui';

const ICONS = {
  trophy: TrophyIcon,
  crown: CrownIcon,
  flame: FlameIcon,
  target: TargetIcon,
  rocket: RocketIcon,
  star: StarIcon,
  medal: MedalIcon,
  zap: ZapIcon,
  shield: ShieldIcon,
  gem: GemIcon,
};

const List = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Badge = styled(motion.span)`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 12px 0 10px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 700;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}18`};
  border: 1px solid ${({ $color }) => `${$color}30`};
  white-space: nowrap;
`;

export default function Achievements({ items, empty = true }) {
  const { t } = useI18n();

  if (!items || items.length === 0) {
    return empty ? <Muted $size="13px">{t('badges.none')}</Muted> : null;
  }

  return (
    <List>
      {items.map((badge, index) => {
        const Icon = ICONS[badge.icon] || TrophyIcon;
        return (
          <Badge
            key={badge.key}
            $color={badge.color}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: index * 0.06,
              type: 'spring',
              stiffness: 320,
              damping: 20,
            }}
            title={t(`badges.${badge.key}Hint`)}
          >
            <Icon size={15} filled={badge.icon === 'star' || badge.icon === 'flame'} />
            {t(`badges.${badge.key}`)}
          </Badge>
        );
      })}
    </List>
  );
}
