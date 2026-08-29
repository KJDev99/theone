'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { dictionaries, useI18n } from '@/lib/i18n';
import { STORAGE_KEY, clampGrade } from '@/lib/model';
import { LEVELS, TONE_COLORS } from '@/lib/levels';
import {
  Button,
  Card,
  CardHead,
  Hint,
  Muted,
  PageHeader,
  Row,
  Stack,
  media,
} from '@/components/ui';
import {
  Field,
  GradeChips,
  Segmented,
  Stepper,
  Switch,
  TextField,
} from '@/components/Fields';
import ConfirmDialog from '@/components/ConfirmDialog';
import { clearLocalState, hasLocalState, readLocalState } from '@/lib/migrate';
import {
  AlertIcon,
  CloudIcon,
  DatabaseIcon,
  DownloadIcon,
  InfoIcon,
  LockIcon,
  MoonIcon,
  PaletteIcon,
  SchoolIcon,
  ShieldIcon,
  SparklesIcon,
  StarIcon,
  SunIcon,
  TrashIcon,
  UploadIcon,
  UserIcon,
  ZapIcon,
} from '@/components/Icons';

/**
 * A section list down the left instead of a masonry of cards. Settings pages
 * grow unevenly, and a two-column grid of tall and short cards leaves large
 * holes; one column at a time always fills the page.
 */
const Layout = styled.div`
  display: grid;
  grid-template-columns: 236px minmax(0, 1fr);
  gap: 20px;
  align-items: start;

  ${media.md`
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
  `}
`;

const SideNav = styled.nav`
  position: sticky;
  top: 82px;
  display: flex;
  flex-direction: column;
  gap: 3px;

  ${media.md`
    position: static;
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 4px;
    &::-webkit-scrollbar { height: 4px; }
  `}
`;

const NavItem = styled.button.attrs({ type: 'button' })`
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  height: 44px;
  padding: 0 13px;
  border: 0;
  border-radius: 13px;
  background: transparent;
  text-align: left;
  font-size: 13.5px;
  font-weight: 650;
  white-space: nowrap;
  color: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.textSoft)};
  transition: color 170ms ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  span,
  svg {
    position: relative;
    z-index: 1;
  }
`;

const NavPill = styled(motion.span)`
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: 13px;
  background: ${({ theme }) => theme.colors.primarySoft};
`;

const Pair = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 16px;
`;

const Trio = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  max-width: 430px;
`;

/** A ruler of the grading bands, so the numbers above it mean something. */
const Scale = styled.div`
  .bar {
    display: flex;
    height: 12px;
    border-radius: 999px;
    overflow: hidden;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    margin-top: 12px;
  }

  .key {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 11.5px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textSoft};
  }

  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }
`;

const Levels = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
`;

const LevelChip = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 750;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}18`};
  border: 1px solid ${({ $color }) => `${$color}30`};

  b {
    font-variant-numeric: tabular-nums;
    opacity: 0.75;
    font-size: 11px;
  }
`;

const WarningNote = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.warningSoft};
  color: ${({ theme }) => theme.colors.warning};
  font-size: 12.5px;
  font-weight: 650;
  line-height: 1.45;
`;

const ErrorNote = styled.p`
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.dangerSoft};
  color: ${({ theme }) => theme.colors.danger};
  font-size: 12.5px;
  font-weight: 650;
`;

const OkNote = styled.p`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.successSoft};
  color: ${({ theme }) => theme.colors.success};
  font-size: 12.5px;
  font-weight: 650;
`;

/** The login, shown but not editable: changing it would mean a new account. */
const ReadOnly = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  height: 46px;
  padding: 0 14px;
  border-radius: 14px;
  border: 1.5px dashed ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.textFaint};

  b {
    font-size: 14px;
    font-weight: 750;
    color: ${({ theme }) => theme.colors.text};
  }
`;

const ReadOnlyAction = styled.button`
  border: 0;
  background: none;
  padding: 0;
  font-size: 11.5px;
  font-weight: 750;
  color: ${({ theme }) => theme.colors.primary};

  &:hover {
    text-decoration: underline;
  }
`;

const Danger = styled(Card)`
  border-color: ${({ theme }) => `${theme.colors.danger}44`};
`;

const SECTIONS = [
  { key: 'appearance', labelKey: 'settings.appearance', Icon: PaletteIcon },
  { key: 'grading', labelKey: 'settings.scoringSection', Icon: ZapIcon },
  { key: 'awards', labelKey: 'awards.settings', Icon: StarIcon },
  { key: 'cloud', labelKey: 'admin.cloud', Icon: CloudIcon },
  { key: 'security', labelKey: 'admin.security', Icon: ShieldIcon },
  { key: 'data', labelKey: 'settings.data', Icon: DatabaseIcon },
];

export default function SettingsPage() {
  const { state, settings, actions, toast, remote, syncError } = useApp();
  const { username, loginName, changeCredentials, isDefaultPassword } = useAuth();
  const { t } = useI18n();
  const fileRef = useRef(null);
  const [section, setSection] = useState('appearance');
  const [wipeOpen, setWipeOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(username);
  const [copiedLogin, setCopiedLogin] = useState(false);
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');
  const [credError, setCredError] = useState('');
  const [leftover, setLeftover] = useState(null);
  const [moving, setMoving] = useState(false);

  // Data left behind by the browser-only version, offered as a one-time move.
  useEffect(() => {
    if (!remote) return;
    setLeftover(hasLocalState() ? readLocalState() : null);
  }, [remote]);

  const minPassword = useMemo(() => (remote ? 6 : 4), [remote]);

  const moveToCloud = async () => {
    if (!leftover) return;
    setMoving(true);
    await actions.importLocalState(leftover);
    clearLocalState();
    setLeftover(null);
    setMoving(false);
    toast(t('admin.migrateDone'));
  };

  const saveCredentials = async (event) => {
    event.preventDefault();
    if (pass1.length < minPassword) {
      setCredError(t('admin.tooShort'));
      return;
    }
    if (pass1 !== pass2) {
      setCredError(t('admin.mismatch'));
      return;
    }
    setCredError('');
    const result = await changeCredentials(adminUser, pass1);
    if (result && result.ok === false) {
      setCredError(result.message || t('admin.wrong'));
      return;
    }
    setPass1('');
    setPass2('');
    toast(t('admin.credentialsSaved'));
  };

  const setAwardStars = (period, index, value) => {
    const next = [...settings.awardStars[period]];
    next[index] = Math.max(0, Number(value) || 0);
    actions.updateSettings({ awardStars: { ...settings.awardStars, [period]: next } });
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bahosystem-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast(t('toast.exported'));
  };

  const importBackup = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        actions.importState(JSON.parse(String(reader.result)));
        toast(t('settings.importDone'));
      } catch (error) {
        toast(t('settings.importFailed'), 'danger');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // The four colour bands, expressed as widths across the hundred.
  const bands = [
    { color: TONE_COLORS.danger, to: Math.max(settings.passMark - 15, 0), key: 'status.low' },
    { color: TONE_COLORS.warning, to: settings.passMark, key: 'status.pass' },
    { color: TONE_COLORS.primary, to: settings.excellentMark, key: 'status.good' },
    { color: TONE_COLORS.success, to: 100, key: 'status.excellent' },
  ];

  return (
    <>
      <PageHeader>
        <div>
          <h1>{t('settings.title')}</h1>
          <Muted style={{ marginTop: 6 }}>{t('settings.subtitle')}</Muted>
        </div>
        <Muted $size="12.5px">
          {t('settings.counts', {
            groups: state.groups.length,
            students: state.students.length,
            marks: state.entries.length,
          })}
        </Muted>
      </PageHeader>

      <Layout>
        <SideNav>
          {SECTIONS.map(({ key, labelKey, Icon }) => (
            <NavItem key={key} $active={section === key} onClick={() => setSection(key)}>
              {section === key && (
                <NavPill
                  layoutId="settings-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <Icon size={17} />
              <span>{t(labelKey)}</span>
            </NavItem>
          ))}
        </SideNav>

        <motion.div
          key={section}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
        >
          <Stack $gap={4}>
            {section === 'appearance' && (
              <>
                <Card>
                  <CardHead>
                    <span className="chip">
                      <PaletteIcon size={18} />
                    </span>
                    <div className="copy">
                      <h2>{t('settings.appearance')}</h2>
                      <p>{t('settings.appearanceHint')}</p>
                    </div>
                  </CardHead>
                  <Pair>
                    <Field label={t('settings.theme')}>
                      <Segmented
                        name="theme"
                        value={settings.theme}
                        onChange={(value) => actions.setTheme(value)}
                        options={[
                          { value: 'light', label: t('settings.light'), icon: <SunIcon size={15} /> },
                          { value: 'dark', label: t('settings.dark'), icon: <MoonIcon size={15} /> },
                        ]}
                      />
                    </Field>

                    <Field label={t('settings.language')}>
                      <Segmented
                        name="lang"
                        value={settings.locale}
                        onChange={(value) => actions.setLocale(value)}
                        options={Object.entries(dictionaries).map(([code, dictionary]) => ({
                          value: code,
                          label: `${dictionary.meta.flag} ${dictionary.meta.name}`,
                        }))}
                      />
                    </Field>
                  </Pair>
                </Card>

                <Card>
                  <CardHead $tint="#12A87A">
                    <span className="chip">
                      <UserIcon size={18} />
                    </span>
                    <div className="copy">
                      <h2>{t('settings.identity')}</h2>
                    </div>
                  </CardHead>
                  <Pair>
                    <TextField
                      id="teacher"
                      label={t('settings.teacher')}
                      hint={t('settings.teacherHint')}
                      icon={UserIcon}
                      value={settings.teacherName}
                      onChange={(event) =>
                        actions.updateSettings({ teacherName: event.target.value })
                      }
                      placeholder="Nilufar Karimova"
                    />
                    <TextField
                      id="school"
                      label={t('settings.school')}
                      hint={t('settings.schoolHint')}
                      icon={SchoolIcon}
                      value={settings.schoolName}
                      onChange={(event) =>
                        actions.updateSettings({ schoolName: event.target.value })
                      }
                      placeholder="TheOne"
                    />
                  </Pair>
                </Card>
              </>
            )}

            {section === 'grading' && (
              <>
                <Card>
                  <CardHead>
                    <span className="chip">
                      <ZapIcon size={18} />
                    </span>
                    <div className="copy">
                      <h2>{t('settings.scoringSection')}</h2>
                      <p>{t('settings.scoringHint')}</p>
                    </div>
                  </CardHead>

                  <Stack $gap={5}>
                    <GradeChips
                      label={t('settings.quickGrades')}
                      hint={t('settings.quickGradesHint')}
                      values={settings.quickGrades}
                      passMark={settings.passMark}
                      excellentMark={settings.excellentMark}
                      onChange={(values) => actions.updateSettings({ quickGrades: values })}
                    />

                    <Pair>
                      <Field label={t('settings.passMark')} hint={t('settings.passMarkHint')}>
                        <Stepper
                          value={settings.passMark}
                          min={20}
                          max={settings.excellentMark - 1}
                          step={5}
                          onChange={(value) =>
                            actions.updateSettings({ passMark: clampGrade(value) })
                          }
                        />
                      </Field>

                      <Field
                        label={t('settings.excellentMark')}
                        hint={t('settings.excellentMarkHint')}
                      >
                        <Stepper
                          value={settings.excellentMark}
                          min={settings.passMark + 1}
                          max={100}
                          step={5}
                          onChange={(value) =>
                            actions.updateSettings({ excellentMark: clampGrade(value) })
                          }
                        />
                      </Field>
                    </Pair>

                    <Field label={t('settings.scale')} hint={t('settings.scaleHint')}>
                      <Scale>
                        <div className="bar">
                          {bands.map((band, index) => {
                            const from = index === 0 ? 0 : bands[index - 1].to;
                            return (
                              <span
                                key={band.key}
                                style={{
                                  width: `${Math.max(band.to - from, 0)}%`,
                                  background: band.color,
                                }}
                              />
                            );
                          })}
                        </div>
                        <div className="legend">
                          {bands.map((band, index) => {
                            const from = index === 0 ? 0 : bands[index - 1].to;
                            return (
                              <span className="key" key={band.key}>
                                <span
                                  className="dot"
                                  style={{ background: band.color }}
                                />
                                {t(band.key)} · {from}–{band.to}
                              </span>
                            );
                          })}
                        </div>
                      </Scale>
                    </Field>

                    <Field label={t('levels.title')} hint={t('levels.basedOn')}>
                      <Levels>
                        {LEVELS.map((level) => (
                          <LevelChip key={level.key} $color={level.color}>
                            {t(`levels.${level.key}`)}
                            <b>{level.min}+</b>
                          </LevelChip>
                        ))}
                      </Levels>
                    </Field>

                    <Pair>
                      <Field label={t('settings.streakGoal')}>
                        <Stepper
                          value={settings.streakGoal}
                          min={2}
                          max={30}
                          onChange={(value) => actions.updateSettings({ streakGoal: value })}
                          suffix={` ${t('common.days')}`}
                        />
                      </Field>
                      <div style={{ alignSelf: 'end' }}>
                        <Switch
                          checked={settings.skipWeekends}
                          onChange={(value) => actions.updateSettings({ skipWeekends: value })}
                          title={t('settings.skipWeekends')}
                          body={t('settings.skipWeekendsHint')}
                        />
                      </div>
                    </Pair>
                  </Stack>
                </Card>
              </>
            )}

            {section === 'awards' && (
              <Card>
                <CardHead $tint="#F0B429">
                  <span className="chip">
                    <StarIcon size={18} filled />
                  </span>
                  <div className="copy">
                    <h2>{t('awards.settings')}</h2>
                    <p>{t('awards.subtitle')}</p>
                  </div>
                </CardHead>

                <Stack $gap={5}>
                  <Field label={t('awards.weekStars')}>
                    <Trio>
                      {settings.awardStars.week.map((value, index) => (
                        <Stepper
                          key={index}
                          value={value}
                          min={0}
                          max={50}
                          onChange={(next) => setAwardStars('week', index, next)}
                        />
                      ))}
                    </Trio>
                  </Field>

                  <Field label={t('awards.monthStars')}>
                    <Trio>
                      {settings.awardStars.month.map((value, index) => (
                        <Stepper
                          key={index}
                          value={value}
                          min={0}
                          max={50}
                          onChange={(next) => setAwardStars('month', index, next)}
                        />
                      ))}
                    </Trio>
                  </Field>

                  <Switch
                    checked={settings.autoSettle}
                    onChange={(value) => actions.updateSettings({ autoSettle: value })}
                    title={t('awards.autoSettle')}
                    body={t('awards.autoSettleHint')}
                  />
                </Stack>
              </Card>
            )}

            {section === 'cloud' && (
              <Card>
                <CardHead $tint={remote ? '#12A87A' : '#8A92A9'}>
                  <span className="chip">
                    {remote ? <CloudIcon size={18} /> : <DatabaseIcon size={18} />}
                  </span>
                  <div className="copy">
                    <h2>{t('admin.cloud')}</h2>
                    <p>{remote ? t('nav.cloud') : t('nav.local')}</p>
                  </div>
                </CardHead>

                <Stack $gap={4}>
                  {remote ? (
                    <OkNote>
                      <CloudIcon size={16} />
                      {t('admin.cloudOn')}
                    </OkNote>
                  ) : (
                    <Muted $size="13px">{t('admin.cloudOff')}</Muted>
                  )}

                  {remote && loginName && (
                    <Row $gap={2}>
                      <UserIcon size={15} />
                      <Muted $size="12.5px">{t('admin.signedInAs', { user: loginName })}</Muted>
                    </Row>
                  )}

                  {syncError && (
                    <ErrorNote>{t('admin.syncProblem', { message: syncError })}</ErrorNote>
                  )}

                  {remote && leftover && (
                    <>
                      <WarningNote>
                        <UploadIcon size={15} />
                        <span>
                          {t('admin.migrateHint', {
                            groups: leftover.groups.length,
                            students: leftover.students.length,
                          })}
                        </span>
                      </WarningNote>
                      <Button
                        $variant="primary"
                        onClick={moveToCloud}
                        disabled={moving}
                        style={{ alignSelf: 'flex-start' }}
                      >
                        <UploadIcon size={16} />
                        {t('admin.migrate')}
                      </Button>
                    </>
                  )}

                  <Hint>{remote ? t('admin.remoteNote') : t('admin.securityNote')}</Hint>
                </Stack>
              </Card>
            )}

            {section === 'security' && (
              <Card>
                <CardHead $tint="#5B5BF0">
                  <span className="chip">
                    <ShieldIcon size={18} />
                  </span>
                  <div className="copy">
                    <h2>{t('admin.security')}</h2>
                    <p>{t('admin.changeCredentials')}</p>
                  </div>
                </CardHead>

                {isDefaultPassword && (
                  <WarningNote style={{ marginBottom: 16 }}>
                    <LockIcon size={15} />
                    <span>{t('admin.defaultWarning')}</span>
                  </WarningNote>
                )}

                {remote && (
                  <Field
                    label={t('admin.yourLogin')}
                    hint={t('admin.loginFixed')}
                    counter={
                      <ReadOnlyAction
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(loginName);
                          setCopiedLogin(true);
                          window.setTimeout(() => setCopiedLogin(false), 1600);
                        }}
                      >
                        {copiedLogin ? t('common.copied') : t('common.copy')}
                      </ReadOnlyAction>
                    }
                  >
                    <ReadOnly>
                      <UserIcon size={17} />
                      <b>{loginName}</b>
                    </ReadOnly>
                  </Field>
                )}

                <form onSubmit={saveCredentials} style={{ marginTop: remote ? 18 : 0 }}>
                  <Stack $gap={4}>
                    <TextField
                      id="admin-username"
                      label={remote ? t('admin.displayName') : t('admin.username')}
                      icon={UserIcon}
                      value={adminUser}
                      onChange={(event) => setAdminUser(event.target.value)}
                      autoComplete="name"
                    />
                    <Pair>
                      <TextField
                        id="admin-pass1"
                        label={t('admin.newPassword')}
                        icon={LockIcon}
                        type="password"
                        value={pass1}
                        onChange={(event) => setPass1(event.target.value)}
                        autoComplete="new-password"
                        hint={remote ? t('admin.passwordMin') : `${minPassword}+`}
                      />
                      <TextField
                        id="admin-pass2"
                        label={t('admin.repeatPassword')}
                        icon={LockIcon}
                        type="password"
                        value={pass2}
                        onChange={(event) => setPass2(event.target.value)}
                        autoComplete="new-password"
                      />
                    </Pair>
                    {credError && <ErrorNote>{credError}</ErrorNote>}
                    <Button
                      type="submit"
                      $variant="primary"
                      disabled={!pass1 || !pass2 || !adminUser.trim()}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      <LockIcon size={16} />
                      {t('common.save')}
                    </Button>
                  </Stack>
                </form>
              </Card>
            )}

            {section === 'data' && (
              <>
                <Card>
                  <CardHead $tint="#0FA3C7">
                    <span className="chip">
                      <DatabaseIcon size={18} />
                    </span>
                    <div className="copy">
                      <h2>{t('settings.data')}</h2>
                      <p>{t('settings.dataHint')}</p>
                    </div>
                  </CardHead>
                  <Row $gap={2} $wrap>
                    <Button onClick={exportBackup}>
                      <DownloadIcon size={16} />
                      {t('settings.export')}
                    </Button>
                    <Button onClick={() => fileRef.current?.click()}>
                      <UploadIcon size={16} />
                      {t('settings.import')}
                    </Button>
                    <Button $variant="soft" onClick={actions.loadDemo}>
                      <SparklesIcon size={16} />
                      {t('settings.demo')}
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="application/json"
                      onChange={importBackup}
                      style={{ display: 'none' }}
                    />
                  </Row>
                  <Hint style={{ marginTop: 12 }}>{t('settings.demoHint')}</Hint>
                </Card>

                <Card>
                  <CardHead $tint="#8A5BF0">
                    <span className="chip">
                      <InfoIcon size={18} />
                    </span>
                    <div className="copy">
                      <h2>{t('settings.about')}</h2>
                    </div>
                  </CardHead>
                  <Muted $size="13px">{t('settings.aboutBody')}</Muted>
                  <Hint style={{ marginTop: 10 }}>
                    {t('app.name')} · {STORAGE_KEY}
                  </Hint>
                </Card>

                <Danger>
                  <CardHead $tint="#E5484D">
                    <span className="chip">
                      <AlertIcon size={18} />
                    </span>
                    <div className="copy">
                      <h2>{t('settings.wipe')}</h2>
                      <p>{t('settings.wipeConfirm')}</p>
                    </div>
                  </CardHead>
                  <Button
                    $variant="danger"
                    onClick={() => setWipeOpen(true)}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <TrashIcon size={16} />
                    {t('settings.wipe')}
                  </Button>
                </Danger>
              </>
            )}
          </Stack>
        </motion.div>
      </Layout>

      <ConfirmDialog
        open={wipeOpen}
        onClose={() => setWipeOpen(false)}
        title={t('settings.wipe')}
        body={t('settings.wipeConfirm')}
        confirmLabel={t('common.delete')}
        onConfirm={() => {
          actions.wipe();
          toast(t('settings.wipe'), 'danger');
        }}
      />
    </>
  );
}
