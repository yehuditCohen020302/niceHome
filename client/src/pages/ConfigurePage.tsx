import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BUDGET_PRESETS,
  MAX_BUDGET,
  MAX_CITY_LENGTH,
  MAX_NOTES_LENGTH,
  ROOM_CONSTRAINTS,
  ROOM_TYPES,
  STYLES,
  SUPPORTED_ROOM_TYPES,
  UPGRADE_GOALS,
  type StyleChoice,
} from '@nice-home/shared';
import { ApiError } from '../api/client';
import { createRoom } from '../api/rooms';
import { buttonClasses } from '../components/buttonStyles';
import { ChoiceChip } from '../components/form/ChoiceChip';
import { FormSection } from '../components/form/FormSection';
import { StyleCard } from '../components/form/StyleCard';
import { ISRAELI_CITY_SUGGESTIONS } from '../features/configure/israeliCities';
import {
  defaultPreferencesForm,
  toCreateRoomRequest,
  toggleInList,
  validatePreferences,
  type FormErrors,
  type PreferencesForm,
} from '../features/configure/preferencesForm';
import { STYLE_SWATCHES } from '../features/configure/styleSwatches';
import { useRoomDraft } from '../features/room-draft/RoomDraftProvider';
import { useI18n, type MessageKey } from '../i18n';

const STYLE_OPTIONS: StyleChoice[] = ['auto', ...STYLES];

type SubmitError = Extract<MessageKey, `configure.error.${string}`>;

export function ConfigurePage() {
  const { t, formatPrice, locale } = useI18n();
  const navigate = useNavigate();
  const { draft, updateDraft } = useRoomDraft();
  const ids = useId();

  const form = draft.preferences ?? defaultPreferencesForm;
  const [errors, setErrors] = useState<FormErrors>({});
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Every edit is saved to the draft, so going back to the upload page or refreshing keeps the choices.
  const update = (patch: Partial<PreferencesForm>) => {
    const next = { ...form, ...patch };
    updateDraft({ preferences: next });
    if (showErrors) setErrors(validatePreferences(next));
    setSubmitError(null);
  };

  if (!draft.image) {
    return (
      <section className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <p className="text-lg">{t('configure.noImage')}</p>
        <Link to="/upload" className={`${buttonClasses('primary')} mt-6`}>
          {t('configure.goUpload')}
        </Link>
      </section>
    );
  }
  const image = draft.image;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validatePreferences(form);
    setErrors(found);
    setShowErrors(true);
    const firstInvalid = (['goals', 'budget'] as const).find((field) => found[field]);
    if (firstInvalid) {
      document.getElementById(`${ids}-${firstInvalid}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const room = await createRoom(toCreateRoomRequest(form, image.id), controller.signal);
      navigate(`/rooms/${room.id}`);
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.isServerUnreachable) setSubmitError('configure.error.serverDown');
      else if (error instanceof ApiError && error.code === 'image_not_found') setSubmitError('configure.error.imageMissing');
      else setSubmitError('configure.error.generic');
      setSubmitting(false);
    }
  };

  const budget = form.budget;
  const customBudgetId = `${ids}-custom-budget`;
  const cityListId = `${ids}-cities`;
  const hasErrors = showErrors && Object.keys(errors).length > 0;

  return (
    <form noValidate onSubmit={handleSubmit} className="mx-auto max-w-3xl px-4 pt-8 pb-32 sm:px-6 sm:pt-12">
      <header className="flex items-center gap-4">
        <img
          src={image.url}
          alt={t('upload.previewAlt')}
          className="size-20 shrink-0 rounded-2xl object-cover shadow-sm sm:size-24"
        />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('configure.title')}</h1>
          <p className="mt-1 text-sm text-ink-muted sm:text-base">{t('configure.subtitle')}</p>
          <Link to="/upload" className="mt-1 inline-block text-sm font-medium text-accent-strong underline-offset-2 hover:underline">
            {t('configure.changeImage')}
          </Link>
        </div>
      </header>

      <div className="mt-8 space-y-4">
        <FormSection id={`${ids}-room`} title={t('configure.room.title')}>
          <div className="flex flex-wrap gap-2">
            {ROOM_TYPES.map((type) => {
              const supported = SUPPORTED_ROOM_TYPES.includes(type);
              return (
                <ChoiceChip
                  key={type}
                  type="radio"
                  name="roomType"
                  checked={form.roomType === type}
                  onChange={() => update({ roomType: type })}
                  disabled={!supported}
                  badge={supported ? undefined : t('configure.room.comingSoon')}
                >
                  {t(`roomType.${type}`)}
                </ChoiceChip>
              );
            })}
          </div>
        </FormSection>

        <FormSection
          id={`${ids}-goals`}
          title={t('configure.goals.title')}
          hint={t('configure.goals.hint')}
          error={showErrors && errors.goals ? t(errors.goals) : undefined}
        >
          <div className="flex flex-wrap gap-2">
            {UPGRADE_GOALS.map((goal) => (
              <ChoiceChip
                key={goal}
                type="checkbox"
                name="goals"
                checked={form.goals.includes(goal)}
                onChange={() => update({ goals: toggleInList(form.goals, goal) })}
              >
                {t(`goal.${goal}`)}
              </ChoiceChip>
            ))}
          </div>
        </FormSection>

        <FormSection
          id={`${ids}-constraints`}
          title={t('configure.constraints.title')}
          hint={t('configure.constraints.hint')}
          aside={t('configure.optional')}
        >
          <div className="flex flex-wrap gap-2">
            {ROOM_CONSTRAINTS.map((constraint) => (
              <ChoiceChip
                key={constraint}
                type="checkbox"
                name="constraints"
                checked={form.constraints.includes(constraint)}
                onChange={() => update({ constraints: toggleInList(form.constraints, constraint) })}
              >
                {t(`constraint.${constraint}`)}
              </ChoiceChip>
            ))}
          </div>
        </FormSection>

        <FormSection
          id={`${ids}-budget`}
          title={t('configure.budget.title')}
          error={showErrors && errors.budget ? t(errors.budget, { max: MAX_BUDGET.toLocaleString(locale.intl) }) : undefined}
        >
          <div className="flex flex-wrap gap-2">
            {BUDGET_PRESETS.map((amount) => (
              <ChoiceChip
                key={amount ?? 'unlimited'}
                type="radio"
                name="budget"
                checked={budget?.kind === 'preset' && budget.amount === amount}
                onChange={() => update({ budget: { kind: 'preset', amount } })}
              >
                {amount === null
                  ? t('configure.budget.unlimited')
                  : t('configure.budget.upTo', { amount: formatPrice(amount) })}
              </ChoiceChip>
            ))}
            <ChoiceChip
              type="radio"
              name="budget"
              checked={budget?.kind === 'custom'}
              onChange={() => update({ budget: { kind: 'custom', text: budget?.kind === 'custom' ? budget.text : '' } })}
            >
              {t('configure.budget.custom')}
            </ChoiceChip>
          </div>
          {budget?.kind === 'custom' && (
            <div className="mt-4 max-w-xs">
              <label htmlFor={customBudgetId} className="text-sm font-medium">
                {t('configure.budget.customLabel')}
              </label>
              {/* Numbers read left-to-right; the wrapper's direction also places the ₪ sign after them. */}
              <div className="relative mt-1.5" dir="ltr">
                <input
                  id={customBudgetId}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  autoFocus
                  value={budget.text}
                  onChange={(event) => update({ budget: { kind: 'custom', text: event.target.value } })}
                  className="h-12 w-full rounded-xl border border-line bg-canvas ps-4 pe-10 text-base focus:border-ink focus:outline-none"
                />
                <span className="pointer-events-none absolute inset-y-0 end-4 flex items-center text-ink-muted" aria-hidden>
                  ₪
                </span>
              </div>
            </div>
          )}
        </FormSection>

        <FormSection id={`${ids}-style`} title={t('configure.style.title')}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {STYLE_OPTIONS.map((style) => (
              <StyleCard
                key={style}
                name="style"
                value={style}
                checked={form.style === style}
                onChange={() => update({ style })}
                title={t(`style.${style}`)}
                description={t(`style.${style}.desc`)}
                swatches={STYLE_SWATCHES[style]}
              />
            ))}
          </div>
        </FormSection>

        <FormSection
          id={`${ids}-location`}
          title={t('configure.location.title')}
          hint={t('configure.location.hint')}
          aside={t('configure.optional')}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${ids}-country`} className="text-sm font-medium">
                {t('configure.location.country')}
              </label>
              <select
                id={`${ids}-country`}
                disabled
                className="mt-1.5 h-12 w-full rounded-xl border border-line bg-canvas px-4 text-base text-ink-muted"
              >
                <option>{t('configure.location.countryIL')}</option>
              </select>
            </div>
            <div>
              <label htmlFor={`${ids}-city`} className="text-sm font-medium">
                {t('configure.location.city')}
              </label>
              <input
                id={`${ids}-city`}
                type="text"
                list={cityListId}
                autoComplete="address-level2"
                maxLength={MAX_CITY_LENGTH}
                placeholder={t('configure.location.cityPlaceholder')}
                value={form.city}
                onChange={(event) => update({ city: event.target.value })}
                className="mt-1.5 h-12 w-full rounded-xl border border-line bg-canvas px-4 text-base placeholder:text-ink-muted/60 focus:border-ink focus:outline-none"
              />
              <datalist id={cityListId}>
                {ISRAELI_CITY_SUGGESTIONS.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </div>
          </div>
        </FormSection>

        <FormSection id={`${ids}-notes`} title={t('configure.notes.title')} aside={t('configure.optional')}>
          <textarea
            aria-label={t('configure.notes.title')}
            rows={3}
            maxLength={MAX_NOTES_LENGTH}
            placeholder={t('configure.notes.placeholder')}
            value={form.notes}
            onChange={(event) => update({ notes: event.target.value })}
            className="w-full resize-y rounded-xl border border-line bg-canvas px-4 py-3 text-base placeholder:text-ink-muted/60 focus:border-ink focus:outline-none"
          />
          <p className="mt-1 text-end text-xs text-ink-muted" aria-live="polite">
            {t('configure.notes.counter', { count: form.notes.length, max: MAX_NOTES_LENGTH })}
          </p>
        </FormSection>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-h-5 text-sm" role="status" aria-live="polite">
            {submitError ? (
              <span className="font-medium text-danger-ink">
                {t(submitError)}{' '}
                {submitError === 'configure.error.imageMissing' && (
                  <Link to="/upload" className="underline underline-offset-2">
                    {t('configure.goUpload')}
                  </Link>
                )}
              </span>
            ) : hasErrors ? (
              <span className="font-medium text-danger-ink">{t('configure.fixErrors')}</span>
            ) : null}
          </div>
          <button type="submit" disabled={submitting} className={`${buttonClasses('primary', 'lg')} sm:min-w-48`}>
            {submitting && (
              <span className="size-4 animate-spin rounded-full border-2 border-canvas/40 border-t-canvas" aria-hidden />
            )}
            {submitting ? t('configure.submitting') : t('configure.submit')}
          </button>
        </div>
      </div>
    </form>
  );
}
