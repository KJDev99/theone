'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled, { css } from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import Logo from './Logo';
import { useI18n } from '@/lib/i18n';
import { averageOf, entriesForPeriod } from '@/lib/calc';
import { gradeColor } from '@/lib/levels';
import { formatDate, todayKey } from '@/lib/dates';
import StudentFinder from './StudentFinder';
import {
  ArrowLeftIcon,
  CloudIcon,
  DashboardIcon,
  DatabaseIcon,
  HomeIcon,
  LogoutIcon,
  MoonIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  SparklesIcon,
  SunIcon,
  TrophyIcon,
  UsersIcon,
  XIcon,
} from './Icons';
import { IconButton, media } from './ui';

const PUBLIC_NAV = [
  { href: '/', key: 'home', Icon: HomeIcon },
  { href: '/leaderboard', key: 'leaderboard', Icon: TrophyIcon },
  { href: '/groups', key: 'groups', Icon: UsersIcon },
];

const ADMIN_NAV = [
  { href: '/admin', key: 'dashboard', Icon: DashboardIcon },
  { href: '/admin/groups', key: 'groups', Icon: UsersIcon },
  { href: '/admin/awards', key: 'awards', Icon: SparklesIcon },
  { href: '/admin/settings', key: 'settings', Icon: SettingsIcon },
];

const Layout = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 256px minmax(0, 1fr);
  min-height: 100vh;

  ${media.md`
    grid-template-columns: minmax(0, 1fr);
  `}
`;

const Sidebar = styled.aside`
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 22px 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceGlass};
  backdrop-filter: blur(16px);

  ${media.md`display: none;`}
`;

const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 4px 8px;

  .mark {
    width: 38px;
    height: 38px;
    flex: none;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: ${({ theme }) => theme.gradient.brand};
    color: #fff;
    font-weight: 800;
    font-size: 17px;
    box-shadow: ${({ theme }) => theme.shadow.glow};
  }

  .name {
    font-weight: 800;
    letter-spacing: -0.02em;
    font-size: 16px;
    line-height: 1.1;
    display: block;
  }

  .tag {
    font-size: 11px;
    color: ${({ theme }) => theme.colors.textFaint};
    display: block;
    margin-top: 2px;
  }
`;

const NavGroup = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;

  .eyebrow {
    display: block;
    padding: 0 12px;
    margin-bottom: 7px;
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.textFaint};
  }
`;

const NavList = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const navItem = css`
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  height: 44px;
  padding: 0 12px;
  border-radius: 13px;
  font-size: 14px;
  font-weight: 650;
  color: ${({ theme }) => theme.colors.textSoft};
  transition: color 180ms ease, background-color 180ms ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.surfaceAlt};
  }

  ${({ $active, theme }) =>
    $active &&
    css`
      color: ${theme.colors.primary};
      background: ${theme.colors.primarySoft};
      &:hover {
        background: ${theme.colors.primarySoft};
      }
    `}
`;

const NavLink = styled(Link)`
  ${navItem}
`;

const ActiveDot = styled(motion.span)`
  position: absolute;
  left: -14px;
  width: 3px;
  height: 22px;
  border-radius: 0 4px 4px 0;
  background: ${({ theme }) => theme.colors.primary};
`;

const PanelLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 13px;
  font-size: 13px;
  font-weight: 650;
  border: 1px dashed ${({ theme }) => theme.colors.borderStrong};
  color: ${({ theme }) => theme.colors.textSoft};
  transition: color 180ms ease, border-color 180ms ease, background-color 180ms ease;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primarySoft};
  }
`;

/**
 * The pulse card at the foot of the sidebar. It is the one place that always
 * shows how the week is going, whichever page you are on.
 */
const Pulse = styled.div`
  border-radius: 16px;
  padding: 13px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};

  .row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  .label {
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.textFaint};
  }

  .value {
    font-size: 23px;
    font-weight: 800;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
    color: ${({ $color, theme }) => $color || theme.colors.text};
  }

  .bar {
    margin-top: 10px;
    height: 6px;
    border-radius: 99px;
    background: ${({ theme }) => theme.colors.border};
    overflow: hidden;
  }

  .meta {
    margin-top: 9px;
    font-size: 11px;
    line-height: 1.45;
    color: ${({ theme }) => theme.colors.textFaint};
  }
`;

const PulseFill = styled(motion.div)`
  height: 100%;
  border-radius: 99px;
  background: ${({ $color }) => `linear-gradient(90deg, ${$color}88, ${$color})`};
`;

const SideFooter = styled.div`
  display: flex;
  gap: 8px;
`;

const Column = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

/* ---------------------------------------------------------------- top bar */

const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 40px;
  background: ${({ theme }) => theme.colors.surfaceGlass};
  backdrop-filter: blur(18px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  ${media.lg`padding: 12px 20px;`}
  ${media.md`padding: 10px 14px;`}

  .mobile-brand {
    display: none;
    ${media.md`display: flex;`}
  }

  .title {
    min-width: 0;
    ${media.md`display: none;`}

    h1 {
      font-size: 17px;
      font-weight: 750;
      letter-spacing: -0.02em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    p {
      margin-top: 1px;
      font-size: 11.5px;
      color: ${({ theme }) => theme.colors.textFaint};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
`;

const Spacer = styled.div`
  flex: 1;
`;

const SearchTrigger = styled.button.attrs({ type: 'button' })`
  display: flex;
  align-items: center;
  gap: 9px;
  width: 260px;
  height: 40px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.textFaint};
  font-size: 13.5px;
  font-weight: 600;
  transition: border-color 170ms ease, color 170ms ease, background-color 170ms ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.surface};
  }

  .label {
    flex: 1;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  kbd {
    font: inherit;
    font-size: 10.5px;
    font-weight: 800;
    padding: 3px 6px;
    border-radius: 6px;
    background: ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.textSoft};
  }

  ${media.lg`
    width: 44px;
    justify-content: center;
    padding: 0;
    .label, kbd { display: none; }
  `}
`;

/** The little facts strip: today, the week average, and where the data lives. */
const Facts = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  ${media.lg`display: none;`}
`;

const Fact = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 40px;
  padding: 0 13px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  font-size: 12.5px;
  font-weight: 700;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.textSoft};

  svg {
    color: ${({ theme, $tint }) => $tint || theme.colors.textFaint};
  }

  b {
    font-variant-numeric: tabular-nums;
    color: ${({ theme, $tint }) => $tint || theme.colors.text};
  }
`;

const Account = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  height: 40px;
  padding: 0 6px 0 12px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};

  .who {
    max-width: 130px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12.5px;
    font-weight: 700;
    text-transform: uppercase;
  }

  ${media.md`
    .who { display: none; }
    padding: 0 6px;
  `}
`;

const Main = styled.main`
  min-width: 0;
  flex: 1;
  padding: 26px 40px 60px;

  ${media.lg`padding: 22px 20px 60px;`}
  ${media.md`padding: 18px 14px 104px;`}
`;

const Inner = styled(motion.div)`
  max-width: 1240px;
  margin: 0 auto;
`;

const BottomNav = styled.nav`
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  padding: 8px 8px calc(8px + env(safe-area-inset-bottom));
  background: ${({ theme }) => theme.colors.surfaceGlass};
  backdrop-filter: blur(18px);
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  ${media.md`
    display: grid;
    grid-template-columns: repeat(${({ $count }) => $count}, 1fr);
  `}
`;

const BottomLink = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 7px 2px;
  border-radius: 12px;
  font-size: 10.5px;
  font-weight: 650;
  color: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.textFaint)};
  background: ${({ theme, $active }) => ($active ? theme.colors.primarySoft : 'transparent')};
  transition: color 180ms ease, background-color 180ms ease;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
`;

/* ---------------------------------------------------------- search palette */

const Scrim = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 90;
  background: ${({ theme }) => theme.colors.overlay};
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  padding: 12vh 16px 16px;
  overflow-y: auto;

  ${media.sm`padding-top: 6vh;`}
`;

const Palette = styled(motion.div)`
  width: 100%;
  max-width: 560px;
  height: max-content;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.lg};

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;

    h2 {
      font-size: 15px;
      font-weight: 750;
    }
  }
`;

function isActive(pathname, href) {
  if (href === '/' || href === '/admin') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ThemeToggle({ size = 'md' }) {
  const { theme, actions } = useApp();
  const { t } = useI18n();
  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <IconButton
      $variant="outline"
      $size={size}
      onClick={() => actions.setTheme(next)}
      aria-label={t('a11y.toggleTheme')}
      title={t('a11y.toggleTheme')}
    >
      <motion.span
        key={theme}
        initial={{ rotate: -60, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
        style={{ display: 'grid', placeItems: 'center' }}
      >
        {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
      </motion.span>
    </IconButton>
  );
}

const LangButton = styled(IconButton)`
  width: auto;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
`;

export function LanguageToggle({ size = 'md' }) {
  const { locale, actions } = useApp();
  const { t } = useI18n();
  const next = locale === 'uz' ? 'en' : 'uz';

  return (
    <LangButton
      $variant="outline"
      $size={size}
      onClick={() => actions.setLocale(next)}
      aria-label={t('a11y.toggleLanguage')}
      title={t('a11y.toggleLanguage')}
    >
      {locale === 'uz' ? 'UZ' : 'EN'}
    </LangButton>
  );
}

export default function Shell({ children }) {
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const { state, settings, remote } = useApp();
  const { authed, logout, username } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  // The date is rendered only after mount: the server has no idea which day it
  // is where the reader is sitting, and a mismatch would trip hydration.
  const [dateLabel, setDateLabel] = useState('');

  const inAdmin = pathname.startsWith('/admin');
  const items = useMemo(
    () => (inAdmin && authed ? ADMIN_NAV : PUBLIC_NAV),
    [inAdmin, authed]
  );

  const bottomItems = useMemo(() => {
    const extra =
      inAdmin && authed
        ? { href: '/', key: 'site', Icon: ArrowLeftIcon }
        : { href: '/admin', key: 'admin', Icon: ShieldIcon };
    return [...items, extra];
  }, [items, inAdmin, authed]);

  const active = items.find((item) => isActive(pathname, item.href));

  // This week at a glance — the number the top bar and the sidebar both show.
  const week = useMemo(() => {
    const marks = entriesForPeriod(state.entries, 'week', todayKey());
    return { average: averageOf(marks), count: marks.length };
  }, [state.entries]);

  const weekColor = gradeColor(week.average, {
    passMark: settings.passMark,
    excellentMark: settings.excellentMark,
  });

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    setDateLabel(
      formatDate(todayKey(), locale, { weekday: 'long', day: 'numeric', month: 'long' })
    );
  }, [locale]);

  return (
    <Layout>
      <Sidebar>
        <Brand href={inAdmin && authed ? '/admin' : '/'}>
          <span className="mark">
            <Logo size={21} />
          </span>
          <span>
            <span className="name">{settings.schoolName || t('app.name')}</span>
            <span className="tag">
              {inAdmin && authed ? t('admin.title') : t('app.tagline')}
            </span>
          </span>
        </Brand>

        <NavGroup>
          <span className="eyebrow">{inAdmin && authed ? t('nav.manage') : t('nav.browse')}</span>
          <NavList>
            {items.map(({ href, key, Icon }) => {
              const on = isActive(pathname, href);
              return (
                <NavLink key={href} href={href} $active={on}>
                  {on && <ActiveDot layoutId="nav-dot" />}
                  <Icon size={19} />
                  {t(`nav.${key}`)}
                </NavLink>
              );
            })}
          </NavList>
        </NavGroup>

        <Pulse $color={week.count ? weekColor : undefined}>
          <div className="row">
            <span className="label">{t('nav.weekAverage')}</span>
            <span className="value">{week.count ? week.average : '—'}</span>
          </div>
          <div className="bar">
            <PulseFill
              $color={weekColor}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(week.average, 100)}%` }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="meta">
            {t('nav.pulseMeta', {
              marks: week.count,
              students: state.students.length,
            })}
          </div>
        </Pulse>

        {inAdmin && authed ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <PanelLink href="/">
              <ArrowLeftIcon size={16} />
              {t('nav.site')}
            </PanelLink>
            <PanelLink as="button" type="button" onClick={logout} style={{ width: '100%' }}>
              <LogoutIcon size={16} />
              {t('admin.signOut')}
            </PanelLink>
          </div>
        ) : (
          <PanelLink href="/admin">
            <ShieldIcon size={16} />
            {t('public.teacherArea')}
          </PanelLink>
        )}

        <SideFooter>
          <ThemeToggle />
          <LanguageToggle />
        </SideFooter>
      </Sidebar>

      <Column>
        <Bar>
          <Brand className="mobile-brand" href={inAdmin && authed ? '/admin' : '/'}>
            <span className="mark">
            <Logo size={21} />
          </span>
          </Brand>

          <div className="title">
            <h1>{active ? t(`nav.${active.key}`) : t('app.name')}</h1>
            <p>{dateLabel || t('app.tagline')}</p>
          </div>

          <Spacer />

          <Facts>
            <Fact $tint={week.count ? weekColor : undefined}>
              <TrophyIcon size={15} />
              {t('nav.weekAverage')} <b>{week.count ? week.average : '—'}</b>
            </Fact>
            <Fact>
              {remote ? <CloudIcon size={15} /> : <DatabaseIcon size={15} />}
              {remote ? t('nav.cloud') : t('nav.local')}
            </Fact>
          </Facts>

          <SearchTrigger onClick={() => setSearchOpen(true)}>
            <SearchIcon size={17} />
            <span className="label">{t('public.searchPlaceholder')}</span>
            <kbd>Ctrl K</kbd>
          </SearchTrigger>

          <ThemeToggle size="sm" />
          <LanguageToggle size="sm" />

          {inAdmin && authed ? (
            <Account>
              <span className="who">{username}</span>
              <IconButton
                $variant="ghost"
                $size="sm"
                onClick={logout}
                aria-label={t('admin.signOut')}
              >
                <LogoutIcon size={17} />
              </IconButton>
            </Account>
          ) : (
            <IconButton
              as={Link}
              href="/admin"
              $variant="outline"
              $size="sm"
              aria-label={t('public.teacherArea')}
              title={t('public.teacherArea')}
            >
              <ShieldIcon size={17} />
            </IconButton>
          )}
        </Bar>

        <Main>
          <Inner
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </Inner>
        </Main>
      </Column>

      <BottomNav $count={bottomItems.length}>
        {bottomItems.map(({ href, key, Icon }) => {
          const on = isActive(pathname, href);
          return (
            <BottomLink key={`${href}-${key}`} href={href} $active={on}>
              <Icon size={19} />
              <span>{t(`nav.${key}`)}</span>
            </BottomLink>
          );
        })}
      </BottomNav>

      <AnimatePresence>
        {searchOpen && (
          <Scrim
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSearchOpen(false);
            }}
          >
            <Palette
              initial={{ opacity: 0, y: -14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="head">
                <h2>{t('public.findYou')}</h2>
                <IconButton
                  $variant="ghost"
                  $size="sm"
                  onClick={() => setSearchOpen(false)}
                  aria-label={t('common.close')}
                >
                  <XIcon size={17} />
                </IconButton>
              </div>
              <StudentFinder limit={6} />
            </Palette>
          </Scrim>
        )}
      </AnimatePresence>
    </Layout>
  );
}
