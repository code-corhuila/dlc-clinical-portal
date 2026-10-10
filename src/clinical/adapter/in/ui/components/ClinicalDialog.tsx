import { useEffect } from 'react';

export interface ClinicalDialogProps {
  readonly title: string;
  readonly onClose: () => void;
  readonly children: React.ReactNode;
}

/** Modal used for the mockup's header and footer actions; Escape closes it. */
export function ClinicalDialog({
  title,
  onClose,
  children,
}: ClinicalDialogProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="cl-dialog-backdrop">
      <section
        className="cl-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button type="button" className="cl-dialog__close" onClick={onClose}>
          Cerrar
        </button>
        {children}
      </section>
    </div>
  );
}
