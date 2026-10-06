export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
  'disabled:pointer-events-none disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-canvas hover:bg-ink/85',
  secondary: 'border border-line bg-surface text-ink hover:border-ink/30',
  ghost: 'text-ink hover:bg-ink/5',
};

const sizes: Record<ButtonSize, string> = {
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-13 px-8 text-base',
};

/** Shared button look, usable on <button>, <Link> and <label>. */
export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}
