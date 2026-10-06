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
  'landing.cta': 'התחילו עכשיו',
  'landing.howItWorks': 'איך זה עובד',
  'landing.step1.title': 'מעלים תמונה של החדר',
  'landing.step1.body': 'צילום אחד מהטלפון מספיק. החדר שלכם נשאר החדר שלכם — אותה זווית, אותו מבנה.',
  'landing.step2.title': 'מגדירים מה רוצים',
  'landing.step2.body': 'סגנון, תקציב, ומה אסור לשנות. הספה נשארת? היא תישאר.',
  'landing.step3.title': 'רואים את החדר וקונים',
  'landing.step3.body': 'כל פריט בהדמיה הוא מוצר אמיתי — עם חנות, מחיר עדכני וקישור לרכישה.',
  'landing.promise': 'אנחנו לא ממציאים מוצרים ולא ממציאים מחירים. אם אין מידע אמיתי — נגיד לכם.',

  'illustration.label': 'דוגמה: סלון עם נקודות על מוצרים שאפשר לקנות',
  'illustration.productName': 'עציץ קרמיקה לבן',
  'illustration.store': 'חנות לדוגמה',
  'illustration.cta': 'למוצר',

  'upload.title': 'העלו תמונה של החדר',
  'upload.subtitle': 'תמונה אחת של הסלון, כמו שהוא היום.',
  'upload.dropzone.title': 'גררו תמונה לכאן',
  'upload.dropzone.or': 'או',
  'upload.dropzone.choose': 'בחרו קובץ',
  'upload.dropzone.camera': 'צלמו עכשיו',
  'upload.dropzone.dragActive': 'שחררו כדי להעלות',
  'upload.dropzone.hint': 'JPEG, PNG או WebP, עד {maxMb}MB',
  'upload.uploading': 'מעלים את התמונה…',
  'upload.uploaded': 'התמונה נשמרה במחשב שלכם',
  'upload.replace': 'החליפו תמונה',
  'upload.continue': 'המשך',
  'upload.previewAlt': 'התמונה שהעליתם של החדר',
  'upload.tips.title': 'טיפים לתמונה טובה',
  'upload.tips.wide': 'צלמו לרוחב, מפינת החדר, כך שרוב החדר ייכנס לתמונה',
  'upload.tips.light': 'עדיף באור יום, עם וילונות פתוחים',
  'upload.tips.level': 'החזיקו את הטלפון ישר, בגובה החזה',

  'upload.error.type': 'אפשר להעלות רק תמונות JPEG, PNG או WebP.',
  'upload.error.size': 'התמונה גדולה מדי. הגודל המקסימלי הוא {maxMb}MB.',
  'upload.error.multiple': 'אפשר להעלות תמונה אחת בכל פעם.',
  'upload.error.serverDown': 'השרת המקומי לא זמין, ולכן לא ניתן לשמור את התמונה.',
  'upload.error.generic': 'שמירת התמונה נכשלה. נסו שוב.',
  'upload.retry': 'נסו שוב',

  'configure.title': 'מה תרצו לשדרג?',
  'configure.comingSoon': 'הגדרות השדרוג (סגנון, תקציב ומה אסור לשנות) יתווספו בשלב הבא.',
  'configure.noImage': 'עוד לא העליתם תמונה של החדר.',
  'configure.goUpload': 'להעלאת תמונה',

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
