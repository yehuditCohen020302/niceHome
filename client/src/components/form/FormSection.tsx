import type { ReactNode } from 'react';

interface FormSectionProps {
  id: string;
  title: string;
  hint?: string;
  /** Shown next to the title, e.g. "לא חובה". */
  aside?: string;
  error?: string;
  children: ReactNode;
}

/** A titled group of related inputs. Rendered as a fieldset so the title labels the whole group. */
export function FormSection({ id, title, hint, aside, error, children }: FormSectionProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <fieldset
      id={id}
      aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
      aria-invalid={error ? true : undefined}
      className={`scroll-mt-24 rounded-3xl border bg-surface p-5 sm:p-6 ${error ? 'border-danger-ink/40' : 'border-line'}`}
    >
      <legend className="sr-only">{title}</legend>
      <div aria-hidden className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {aside && <span className="text-xs text-ink-muted">{aside}</span>}
      </div>
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-ink-muted">
          {hint}
        </p>
      )}
      <div className="mt-4">{children}</div>
      {error && (
        <p id={errorId} role="alert" className="mt-3 text-sm font-medium text-danger-ink">
          {error}
        </p>
      )}
    </fieldset>
  );
}
