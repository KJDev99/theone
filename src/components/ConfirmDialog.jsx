'use client';

import { useI18n } from '@/lib/i18n';
import Modal from './Modal';
import { Button, Muted } from './ui';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  tone = 'danger',
}) {
  const { t } = useI18n();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="420px"
      footer={
        <>
          <Button $variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            $variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel || t('common.confirm')}
          </Button>
        </>
      }
    >
      <Muted>{body}</Muted>
    </Modal>
  );
}
