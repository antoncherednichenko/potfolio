'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

import { IconButton } from '../icon-button/icon-button';
import './modal.style.css';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  closeLabel?: string;
  closeOnOverlayClick?: boolean;
};

function CloseIcon() {
  return <span className="game-modal__close-icon">×</span>;
}

export function Modal({
  actions,
  children,
  closeLabel = 'Закрыть окно',
  closeOnOverlayClick = true,
  onClose,
  open,
  title,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;

    const previousActiveElement = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="game-modal"
      onMouseDown={(event) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="game-modal__dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="game-modal__header">
          <h2 className="game-modal__title" id={titleId}>
            {title}
          </h2>
          <IconButton
            icon={<CloseIcon />}
            label={closeLabel}
            onClick={onClose}
            size="small"
            variant="primary"
          />
        </div>
        <div className="game-modal__content">{children}</div>
        {actions ? <div className="game-modal__actions">{actions}</div> : null}
      </div>
    </div>
  );
}

export default Modal;
