'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/lib/i18n';
import { DEFAULT_PASSWORD, DEFAULT_USERNAME } from '@/lib/auth';
import { Button, Card, Hint, Muted, Stack } from './ui';
import { TextField } from './Fields';
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  LoginIcon,
  ShieldIcon,
  UserIcon,
} from './Icons';

const Wrap = styled.div`
  min-height: 60vh;
  display: grid;
  place-items: center;
  padding: 12px 0;
`;

const Panel = styled(motion(Card))`
  width: 100%;
  max-width: 420px;
  padding: 32px 28px;

  .crest {
    width: 54px;
    height: 54px;
    border-radius: 17px;
    display: grid;
    place-items: center;
    color: #fff;
    background: ${({ theme }) => theme.gradient.brand};
    box-shadow: ${({ theme }) => theme.shadow.glow};
    margin-bottom: 16px;
  }

  h1 {
    font-size: 21px;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
`;

/** Wraps the password field so the eye button can sit inside the input. */
const Reveal = styled.div`
  position: relative;

  > button {
    position: absolute;
    right: 9px;
    top: 31px;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: ${({ theme }) => theme.colors.textFaint};

    &:hover {
      color: ${({ theme }) => theme.colors.text};
    }
  }
`;

const Note = styled(motion.p)`
  font-size: 12.5px;
  font-weight: 650;
  line-height: 1.5;
  padding: 11px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.danger};
  background: ${({ theme }) => theme.colors.dangerSoft};
`;

const DefaultHint = styled.div`
  font-size: 12px;
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.warning};
  background: ${({ theme }) => theme.colors.warningSoft};
  padding: 11px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
`;

/**
 * Sign in, and nothing else. There is exactly one teacher account and it is
 * created once in the Supabase dashboard, so this screen has no way to
 * register — that is the point, not an omission.
 */
export default function AdminLogin() {
  const { login, isDefaultPassword, remote } = useAuth();
  const { t } = useI18n();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [note, setNote] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setNote(null);

    const result = await login(identifier, password);
    setBusy(false);

    if (!result.ok) {
      const known = ['badLogin', 'notConfirmed', 'tooMany'];
      setNote(t(known.includes(result.code) ? `admin.${result.code}` : 'admin.wrong'));
      setPassword('');
    }
  };

  return (
    <Wrap>
      <Panel
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="crest">
          <ShieldIcon size={26} />
        </div>
        <h1>{t('admin.loginTitle')}</h1>
        <Muted $size="13.5px" style={{ marginTop: 7 }}>
          {t('admin.loginBody')}
        </Muted>

        <form onSubmit={submit} style={{ marginTop: 22 }}>
          <Stack $gap={4}>
            <TextField
              id="admin-user"
              label={t('admin.username')}
              icon={UserIcon}
              type="text"
              autoCapitalize="none"
              spellCheck={false}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="username"
              autoFocus
              required
            />

            <Reveal>
              <TextField
                id="admin-pass"
                label={t('admin.password')}
                icon={LockIcon}
                type={reveal ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setReveal((current) => !current)}
                aria-label={reveal ? 'Hide password' : 'Show password'}
              >
                {reveal ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </Reveal>

            {note && (
              <Note initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                {note}
              </Note>
            )}

            {!remote && isDefaultPassword && (
              <DefaultHint>
                {t('admin.defaultHint', {
                  user: DEFAULT_USERNAME,
                  pass: DEFAULT_PASSWORD,
                })}
              </DefaultHint>
            )}

            <Button type="submit" $variant="primary" $size="lg" $full disabled={busy}>
              <LoginIcon size={17} />
              {t('admin.signIn')}
            </Button>
          </Stack>
        </form>

        <Hint style={{ marginTop: 16 }}>
          {remote ? t('admin.singleTeacherNote') : t('admin.securityNote')}
        </Hint>
      </Panel>
    </Wrap>
  );
}
