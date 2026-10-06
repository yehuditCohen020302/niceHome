interface StyleCardProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  description: string;
  swatches: readonly string[];
}

/** A radio option for a design style, with a small color palette preview. */
export function StyleCard({ name, value, checked, onChange, title, description, swatches }: StyleCardProps) {
  return (
    <label className="relative block cursor-pointer">
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={
          'flex h-full flex-col gap-3 rounded-2xl border bg-surface p-4 transition ' +
          'border-line hover:border-ink/30 ' +
          'peer-checked:border-ink peer-checked:ring-1 peer-checked:ring-ink ' +
          'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent'
        }
      >
        <span className="flex" aria-hidden>
          {swatches.map((color, index) => (
            <span
              key={color}
              className={`size-6 rounded-full ring-2 ring-surface ${index > 0 ? '-ms-1.5' : ''}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </span>
        <span>
          <span className="block font-semibold" dir="auto">
            {title}
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{description}</span>
        </span>
      </span>
      {checked && (
        <span className="absolute end-3 top-3 flex size-5 items-center justify-center rounded-full bg-ink text-canvas" aria-hidden>
          <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </label>
  );
}
