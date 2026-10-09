/** Decorative line icons from the mockup; hidden from assistive technology. */
const PATHS = {
  plan: 'M9 4h6v3H9zM7 5H5v16h14V5h-2M8 11h8M8 15h5',
  diagnosis: 'M3 12h4l2-5 4 10 2-5h6',
  evolution: 'M4 19h16M6 15l4-4 3 3 5-6',
  alert: 'M12 4l9 16H3zM12 10v4M12 17v.5',
  plus: 'M12 5v14M5 12h14',
  phone:
    'M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 6a2 2 0 0 1 2-2z',
  id: 'M4 6h16v12H4zM8 10h4M8 14h8',
} as const;

export function ClinicalIcon({ name }: { readonly name: keyof typeof PATHS }) {
  return (
    <svg
      className="cl-icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
