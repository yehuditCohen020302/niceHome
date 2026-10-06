import { useI18n } from '../i18n';

/** Hotspot positions in image coordinates (percent), independent of text direction. */
const HOTSPOTS = [
  { left: 17, top: 56 },
  { left: 50, top: 30 },
  { left: 55, top: 84 },
  { left: 84, top: 44 },
];

/**
 * Decorative drawing of the product idea: a room with hotspots on purchasable items.
 * It is an illustration, not a real design, and contains no real product data.
 */
export function HeroIllustration() {
  const { t } = useI18n();

  return (
    <figure
      aria-label={t('illustration.label')}
      className="relative mx-auto aspect-[16/10] w-full max-w-4xl overflow-hidden rounded-[2rem] shadow-[0_30px_80px_-30px_rgb(47_42_36/0.35)]"
    >
      <svg viewBox="0 0 800 500" className="size-full" aria-hidden preserveAspectRatio="xMidYMid slice">
        {/* wall and floor */}
        <rect width="800" height="500" fill="#efe6da" />
        <rect y="360" width="800" height="140" fill="#d9c6ad" />
        <rect y="356" width="800" height="6" fill="#cdb79b" />

        {/* window with curtain */}
        <rect x="560" y="60" width="170" height="220" rx="6" fill="#f8f4ee" stroke="#e2d6c6" strokeWidth="6" />
        <rect x="642" y="60" width="6" height="220" fill="#e2d6c6" />
        <path d="M640 48h120v300c-30 6-60 6-90 0-10-120-20-200-30-300Z" fill="#f3ebe0" />
        <path d="M660 50c4 90 10 190 16 296M700 50c2 100 4 200 6 298M736 50c0 100-2 200-4 296" stroke="#e6dacb" strokeWidth="3" fill="none" />
        <rect x="550" y="42" width="220" height="8" rx="4" fill="#8a6a4a" />

        {/* wall art */}
        <rect x="335" y="95" width="130" height="95" rx="4" fill="#fbf8f3" stroke="#3a3129" strokeWidth="5" />
        <path d="M350 172c25-30 45-40 60-28s30 10 42-12" stroke="#b9773e" strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="430" cy="125" r="11" fill="#e3b788" />

        {/* sofa */}
        <rect x="235" y="250" width="330" height="70" rx="22" fill="#8c9a8a" />
        <rect x="215" y="285" width="370" height="70" rx="20" fill="#7d8b7b" />
        <rect x="235" y="350" width="10" height="20" rx="3" fill="#5a4a3a" />
        <rect x="555" y="350" width="10" height="20" rx="3" fill="#5a4a3a" />
        {/* cushions */}
        <rect x="265" y="245" width="70" height="55" rx="14" fill="#e9c9a3" transform="rotate(-6 300 272)" />
        <rect x="460" y="245" width="70" height="55" rx="14" fill="#f4ece1" transform="rotate(5 495 272)" />

        {/* rug */}
        <ellipse cx="420" cy="440" rx="250" ry="42" fill="#f4ece1" />
        <ellipse cx="420" cy="440" rx="220" ry="32" fill="none" stroke="#e3d3bd" strokeWidth="3" />

        {/* coffee table */}
        <rect x="350" y="395" width="150" height="14" rx="7" fill="#9a6f47" />
        <rect x="365" y="409" width="8" height="28" fill="#7c5838" />
        <rect x="477" y="409" width="8" height="28" fill="#7c5838" />

        {/* plant */}
        <path d="M120 340h70l-10 60h-50Z" fill="#fbf8f3" stroke="#e2d6c6" strokeWidth="3" />
        <path d="M155 340c-40-40-60-90-40-120 20 30 35 70 40 120Z" fill="#5f7d5a" />
        <path d="M155 340c10-60 40-110 75-115-5 45-35 90-75 115Z" fill="#6f8f68" />
        <path d="M155 340c-15-50-5-110 20-140 15 40 10 100-20 140Z" fill="#4f6d4b" />

        {/* floor lamp */}
        <rect x="657" y="230" width="4" height="170" fill="#3a3129" />
        <path d="M630 190h58l-12 45h-34Z" fill="#f2d9b3" />
        <rect x="640" y="398" width="38" height="6" rx="3" fill="#3a3129" />
      </svg>

      {HOTSPOTS.map((position, index) => (
        <span
          key={index}
          className="absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface/95 shadow-md ring-4 ring-surface/40"
          style={{ left: `${position.left}%`, top: `${position.top}%` }}
          aria-hidden
        >
          <span className="size-2.5 rounded-full bg-accent" />
        </span>
      ))}

      {/* product card attached to the plant hotspot */}
      <div
        className="absolute hidden w-52 rounded-2xl bg-surface p-3 text-start shadow-xl sm:block"
        style={{ left: '21%', top: '36%' }}
        aria-hidden
      >
        <div className="flex gap-3">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
            <svg viewBox="0 0 40 40" className="size-9">
              <path d="M12 24h16l-2 12H14Z" fill="#fbf8f3" stroke="#d8c8b4" strokeWidth="1.5" />
              <path d="M20 24c-8-8-11-16-7-21 4 5 7 12 7 21Zm0 0c2-11 8-19 14-20-1 8-7 16-14 20Z" fill="#5f7d5a" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{t('illustration.productName')}</p>
            <p className="text-xs text-ink-muted">{t('illustration.store')}</p>
          </div>
        </div>
        <div className="mt-3 rounded-full bg-ink py-1.5 text-center text-xs font-medium text-canvas">
          {t('illustration.cta')}
        </div>
      </div>
    </figure>
  );
}
