import {
  DEFAULT_COUNTRY,
  DEFAULT_ROOM_TYPE,
  MAX_BUDGET,
  type CreateRoomRequest,
  type RoomConstraint,
  type RoomType,
  type StyleChoice,
  type UpgradeGoal,
} from '@nice-home/shared';
import type { MessageKey } from '../../i18n';

export type BudgetChoice =
  | { kind: 'preset'; amount: number | null }
  | { kind: 'custom'; text: string };

/** Form state as the user edits it. Converted to a CreateRoomRequest on submit. */
export interface PreferencesForm {
  roomType: RoomType;
  goals: UpgradeGoal[];
  constraints: RoomConstraint[];
  budget: BudgetChoice | null;
  style: StyleChoice;
  city: string;
  notes: string;
}

export const defaultPreferencesForm: PreferencesForm = {
  roomType: DEFAULT_ROOM_TYPE,
  goals: [],
  constraints: [],
  budget: null,
  style: 'auto',
  city: '',
  notes: '',
};

export type FormErrors = Partial<Record<'goals' | 'budget', MessageKey>>;

/** Accepts "2000", "2,000" or "2 000". Returns null when the text is not a whole positive amount. */
export function parseBudgetText(text: string): number | null {
  const digits = text.replace(/[\s,]/g, '');
  if (!/^\d+$/.test(digits)) return null;
  const amount = Number(digits);
  return amount >= 1 && amount <= MAX_BUDGET ? amount : null;
}

/** The budget the form currently resolves to; `undefined` when it is missing or invalid. */
export function resolveBudget(choice: BudgetChoice | null): number | null | undefined {
  if (!choice) return undefined;
  if (choice.kind === 'preset') return choice.amount;
  return parseBudgetText(choice.text) ?? undefined;
}

export function validatePreferences(form: PreferencesForm): FormErrors {
  const errors: FormErrors = {};
  if (form.goals.length === 0) errors.goals = 'configure.goals.required';
  if (!form.budget) errors.budget = 'configure.budget.required';
  else if (resolveBudget(form.budget) === undefined) errors.budget = 'configure.budget.invalid';
  return errors;
}

/** Call only after validatePreferences returned no errors. */
export function toCreateRoomRequest(form: PreferencesForm, imageId: string): CreateRoomRequest {
  const city = form.city.trim();
  const notes = form.notes.trim();
  return {
    imageId,
    roomType: form.roomType,
    goals: form.goals,
    constraints: form.constraints,
    budget: resolveBudget(form.budget) ?? null,
    style: form.style,
    ...(city ? { location: { country: DEFAULT_COUNTRY, city } } : {}),
    ...(notes ? { notes } : {}),
  };
}

export function toggleInList<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}
