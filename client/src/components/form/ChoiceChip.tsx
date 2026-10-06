import type { ReactNode } from 'react';

interface ChoiceChipProps {
  type: 'radio' | 'checkbox';
  name: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  /** Small trailing label, e.g. "בקרוב". */
  badge?: ReactNode;
  children: ReactNode;
}

/**
 * A pill-shaped radio/checkbox. Uses a real (visually hidden) input,
 * so keyboard navigation and screen readers work natively.
 */
export function ChoiceChip({ type, name, checked, onChange, disabled, badge, children }: ChoiceChipProps) {
  return (
    <label className={`relative inline-flex ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="peer sr-only"
      />
      <span
        className={
          'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition select-none ' +
          'border-line bg-surface text-ink hover:border-ink/30 ' +
          'peer-checked:border-ink peer-checked:bg-ink peer-checked:text-canvas ' +
          'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ' +
          'peer-disabled:border-line peer-disabled:bg-transparent peer-disabled:text-ink-muted/70'
        }
      >
        {type === 'checkbox' && checked && (
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {children}
        {badge && (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-strong">
            {badge}
          </span>
        )}
      </span>
    </label>
  );
}
