'use client';

import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/lib/i18n';
import { ACCENTS } from '@/lib/identity';
import Modal from './Modal';
import PersonAvatar from './PersonAvatar';
import { Button, Row, Stack } from './ui';
import { Field, Segmented, TextArea, TextField } from './Fields';

const Preview = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};

  .name {
    font-size: 14.5px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hint {
    font-size: 11.5px;
    color: ${({ theme }) => theme.colors.textFaint};
    margin-top: 3px;
  }
`;

export default function StudentDialog({ open, onClose, groupId, student }) {
  const { actions, toast } = useApp();
  const { t } = useI18n();
  const [mode, setMode] = useState('single');
  const [name, setName] = useState('');
  const [bulk, setBulk] = useState('');
  // Dealt, not chosen. Adding one student should cost exactly one decision —
  // the name — the same as pasting a whole class in does. The colour is only
  // there to tell two tiles apart, and it is shown in the preview above.
  const [accent, setAccent] = useState(ACCENTS[0].key);

  useEffect(() => {
    if (!open) return;
    setMode('single');
    setName(student?.name || '');
    setAccent(
      student?.accent || ACCENTS[Math.floor(Math.random() * ACCENTS.length)].key
    );
    setBulk('');
  }, [open, student]);

  const submit = (event) => {
    event.preventDefault();

    if (mode === 'many') {
      const names = bulk
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      if (names.length === 0) return;
      actions.addStudents(groupId, names);
      toast(t('toast.studentsAdded', { count: names.length }));
      onClose();
      return;
    }

    const trimmed = name.trim();
    if (!trimmed) return;
    if (student) {
      actions.updateStudent(student.id, { name: trimmed, accent });
      toast(t('toast.studentUpdated'));
    } else {
      actions.addStudents(groupId, [trimmed], accent);
      toast(t('toast.studentAdded'));
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={student ? t('students.editStudent') : t('students.add')}
    >
      <form onSubmit={submit}>
        <Stack $gap={4}>
          {!student && (
            <Segmented
              name="student-mode"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'single', label: t('students.add') },
                { value: 'many', label: t('students.addMany') },
              ]}
            />
          )}

          {mode === 'single' ? (
            <>
              <Preview>
                <PersonAvatar
                  student={{ id: student?.id || 'preview', name: name || '?', accent }}
                  size={48}
                  glow
                />
                <div style={{ minWidth: 0 }}>
                  <div className="name">
                    {name.trim() || t('students.studentNamePlaceholder')}
                  </div>
                  <div className="hint">{t('students.avatarHint')}</div>
                </div>
              </Preview>

              <TextField
                id="student-name"
                label={t('students.studentName')}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('students.studentNamePlaceholder')}
                autoFocus
                required
              />
            </>
          ) : (
            <Field
              label={t('students.addMany')}
              hint={t('students.addManyHint')}
              htmlFor="student-bulk"
              counter={String(bulk.split('\n').filter((line) => line.trim()).length)}
            >
              <TextArea
                id="student-bulk"
                value={bulk}
                onChange={(event) => setBulk(event.target.value)}
                placeholder={'Aziza Karimova\nBekzod Tursunov\nDilnoza Rashidova'}
                autoFocus
              />
            </Field>
          )}
        </Stack>

        <Row $justify="flex-end" $gap={2} style={{ marginTop: 22 }}>
          <Button type="button" $variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            $variant="primary"
            disabled={mode === 'single' ? !name.trim() : !bulk.trim()}
          >
            {t('common.save')}
          </Button>
        </Row>
      </form>
    </Modal>
  );
}
