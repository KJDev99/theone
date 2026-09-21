'use client';

import styled from 'styled-components';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/lib/i18n';
import AdminLogin from '@/components/AdminLogin';
import { Button, Card, Muted } from '@/components/ui';
import { AlertIcon, LogoutIcon } from '@/components/Icons';

const Denied = styled(Card)`
  max-width: 480px;
  margin: 48px auto;
  text-align: center;
  padding: 40px 28px;

  .art {
    width: 58px;
    height: 58px;
    margin: 0 auto 16px;
    display: grid;
    place-items: center;
    border-radius: 19px;
    color: ${({ theme }) => theme.colors.warning};
    background: ${({ theme }) => theme.colors.warningSoft};
  }

  h2 {
    font-size: 19px;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
`;

/**
 * Every /admin route renders behind this gate.
 *
 * With Supabase it is a real boundary: the database only accepts writes from
 * the single account named in `app_owner`, so hiding the panel here is a
 * courtesy rather than the protection itself. Anyone else who signs in is told
 * plainly why they can see nothing, instead of watching every save fail.
 *
 * Without Supabase it falls back to the browser-only password, which only
 * keeps students out of the controls on a shared device.
 */
export default function AdminLayout({ children }) {
  const { authed, checked, isOwner, logout } = useAuth();
  const { t } = useI18n();

  if (!checked) return null;
  if (!authed) return <AdminLogin />;

  // `isOwner` is null while the answer is unknown; that must never lock anyone
  // out, so only an explicit false closes the panel.
  if (isOwner === false) {
    return (
      <Denied>
        <div className="art">
          <AlertIcon size={28} />
        </div>
        <h2>{t('admin.notTeacherTitle')}!</h2>
        <Muted $size="13.5px" style={{ marginTop: 10 }}>
          {t('admin.notTeacherBody')}
        </Muted>
        <Button $variant="outline" onClick={logout} style={{ marginTop: 22 }}>
          <LogoutIcon size={16} />
          {t('admin.signOut')}
        </Button>
      </Denied>
    );
  }

  return children;
}
