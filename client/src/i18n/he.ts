/**
 * Hebrew UI strings. Every user-facing string lives here, keyed by a stable id,
 * so an English locale can be added later without touching components.
 * Use `{name}` placeholders for interpolation.
 */
export const he = {
  'app.name': 'AI Room Shopping',
  'app.tagline': 'Visual Shopping for Your Home',

  'landing.title': 'צלמו את החדר שלכם. אנחנו נראה לכם איך לשדרג אותו.',
  'landing.subtitle':
    'העלו תמונה, הגדירו תקציב וקבלו הדמיה של החדר שלכם עם מוצרים אמיתיים שאפשר לקנות.',

  'status.checking': 'בודקים חיבור…',
  'status.serverDown': 'השרת המקומי לא זמין. ודאו שהפעלתם את האפליקציה עם npm run dev.',
  'status.offline': 'אין חיבור לאינטרנט — לא ניתן לחפש מוצרים כרגע.',
  'status.mock': 'מצב דוגמה: המוצרים, החנויות והניתוח שמוצגים אינם אמיתיים.',
  'status.retry': 'נסו שוב',

  'notFound.title': 'העמוד לא נמצא',
  'notFound.back': 'חזרה לדף הבית',
} as const;

export type MessageKey = keyof typeof he;
export type Messages = Record<MessageKey, string>;
