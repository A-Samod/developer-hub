'use client';

type Props = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** Inline placement (e.g. sidebar) — skips sticky page positioning */
  compact?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmBanner({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  compact = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-banner-title"
      aria-describedby="confirm-banner-message"
      className={`rounded-xl border-2 px-4 py-4 shadow-md ${
        compact ? '' : 'sticky top-14 z-40 mb-4 lg:top-4'
      } ${
        danger
          ? 'border-[var(--color-danger)] bg-[var(--color-danger-soft)]'
          : 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
      }`}
    >
      <p id="confirm-banner-title" className="text-base font-semibold text-[var(--color-ink)]">
        {title}
      </p>
      <p id="confirm-banner-message" className="mt-1 text-sm text-[var(--color-muted)]">
        {message}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={danger ? 'btn-danger' : 'btn-primary'}
          onClick={onConfirm}
          autoFocus
        >
          {confirmLabel}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
