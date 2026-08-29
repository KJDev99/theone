'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/lib/i18n';
import { GROUP_COLORS } from '@/lib/model';
import Modal from './Modal';
import { Button, Row, Stack } from './ui';
import { Field, TextField } from './Fields';
import { ColorPicker } from './Pickers';

export default function GroupDialog({ open, onClose, group }) {
  const { actions, toast } = useApp();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [color, setColor] = useState(GROUP_COLORS[0]);

  useEffect(() => {
    if (!open) return;
    setName(group?.name || '');
    setColor(group?.color || GROUP_COLORS[0]);
  }, [open, group]);

  const submit = (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (group) {
      actions.updateGroup(group.id, { name: trimmed, color });
      toast(t('toast.groupUpdated'));
    } else {
      // The badge is picked automatically. Opening a class should cost the
      // teacher one decision — its name — and a colour to tell it apart.
      actions.addGroup({ name: trimmed, color });
      toast(t('toast.groupCreated'));
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={group ? t('groups.editGroup') : t('groups.newGroup')}
    >
      <form onSubmit={submit}>
        <Stack $gap={4}>
          <TextField
            id="group-name"
            label={t('groups.groupName')}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('groups.groupNamePlaceholder')}
            autoFocus
            required
          />

          <Field label={t('groups.color')}>
            <ColorPicker options={GROUP_COLORS} value={color} onChange={setColor} />
          </Field>
        </Stack>

        <Row $justify="flex-end" $gap={2} style={{ marginTop: 22 }}>
          <Button type="button" $variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" $variant="primary" disabled={!name.trim()}>
            {t('common.save')}
          </Button>
        </Row>
      </form>
    </Modal>
  );
}
