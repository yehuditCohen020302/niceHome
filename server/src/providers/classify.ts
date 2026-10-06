import type { ProductCategory, Style } from '@nice-home/shared';

/**
 * Text rules that map a real product's Hebrew title/type to our categories, colors and styles.
 * Deterministic keyword matching, not AI: a product that matches no rule is left out
 * rather than guessed into a category.
 */

interface CategoryRule {
  category: ProductCategory;
  include: RegExp;
  /** Matches that mean "same word, different product" (rug for the bath, curtain rod, bed pillow…). */
  exclude?: RegExp;
}

// Order matters: specific phrases ("שולחן סלון") before generic ones.
const CATEGORY_RULES: CategoryRule[] = [
  { category: 'coffee-table', include: /שולחן\s*(סלון|קפה)|שולחנות\s*סלון/, exclude: /כיסוי|מפה|מפת|ראנר|רגל(יים)? ל/ },
  { category: 'side-table', include: /שולחן\s*צד|שולחנות\s*צד|שולחן\s*עזר/, exclude: /כיסוי|מפה|מפת|ראנר/ },
  // "לשטיח/לשטיחים" = for rugs (vacuums, cleaners, underlays): a product for the item, not the item.
  { category: 'rug', include: /שטיח/, exclude: /לשטיח|שואב|ניקוי|מנקה|תחתית\s*מונעת|אמבט|כניסה|מקלחת|יוגה|רכב|מטבח|שטיחון|לחיות|לכלב|לחתול/ },
  { category: 'curtain', include: /וילון|וילונות/, exclude: /לוילון|מוט|אביזר|טבעת|טבעות|מסילה|קרניז|ווים|תפס|סופיות|מקלחת|אמבט/ },
  {
    // Lamps you buy and plug in. Fixtures that need an electrician (ceiling, wall, strips) are left out.
    category: 'lamp',
    include: /מנורת|מנורה|מנורות|אהיל/,
    exclude:
      /(^|\s)נור(ה|ת|ות)\s|בית\s*מנורה|לד\s*להחלפה|שקע|מתאם|תלי(ה|יה)|תלוי|צמוד|תקרה|קיר|פלפון|פס\s*תאורה|שקוע|ספוט|לשולחן\s*כתיבה\s*לילדים/,
  },
  { category: 'cushion', include: /כרית|כריות|ציפית/, exclude: /שינה|ראש|מיטה|הנקה|היריון|הריון|ישיבה|לרכב|לכלב|לחתול|מזרן|גוף/ },
  // "פלד" must stand alone: as a prefix it also matches "פלדה" (steel).
  { category: 'throw', include: /(^|\s)פלד(ים)?(\s|$)|שמיכה\s*לספה|כיסוי\s*ספה|שמיכת\s*(טלוויזיה|סריגה|פליז\s*לספה)|שמיכה\s*סרוגה|ריד(ה|ת)\s*לספה/ },
  { category: 'plant', include: /עציץ|עציצים|צמח\s*מלאכותי|צמחים\s*מלאכותיים|אדנית|קקטוס|מונסטרה|פיקוס/, exclude: /לעציץ|לעציצים|מעמד|אדמה|דשן|מזרק|זרעים|מגש\s*ניקוז/ },
  {
    category: 'wall-art',
    include: /תמונה|תמונת|תמונות|הדפס|פוסטר|קנבס|ציור/,
    exclude: /מסגר|אלבום|מקרן|מצלמה|מתלה|עם\s*הדפס|בהדפס|כבל|HDMI|RCA|AUX|מופה|מופות|ממיר|פלייסמט|צלחת|ספל|כוס|מגש|מפית|מטריה|חולצה|טלוויזי/,
  },
  { category: 'vase', include: /אגרטל/ },
  // "במראה טבעי" means "with a natural look": require the word on its own, not with a prefix letter.
  { category: 'mirror', include: /(^|[\s(-])(מראה|מראת|מראות)(?=[\s)\-,]|$)/, exclude: /איפור|מגדלת|רכב|ידית|אחורית|מגש|תאורה/ },
  { category: 'shelf', include: /מדף|מדפים/, exclude: /מתלה|מקרר|תנור|מקלחת|אמבט|מטבח|(^|\s)וו(\s|$)|ווים|לוח\s*תלייה|רשת|בהדבקה/ },
];

/**
 * Classifies by the product's own title. Store-defined types and collection names were tried
 * and rejected: they are too broad ("תמונה" for HDMI cables, "צמחים" for single flower stems).
 */
export function classifyCategory(title: string): ProductCategory | null {
  const text = title;
  for (const rule of CATEGORY_RULES) {
    if (rule.include.test(text) && !rule.exclude?.test(text)) return rule.category;
  }
  return null;
}

// Color tokens match the planner's style palettes (see RuleBasedPlanner).
const COLOR_RULES: [string, RegExp][] = [
  ['white', /לבן|לבנה|לבנים/],
  ['black', /שחור|שחורה|שחורים/],
  ['grey', /אפור|אפורה|אפורים|אנתרציט/],
  ['beige', /בז'|בז׳|בזי|חול/],
  ['cream', /שמנת|קרם|אוף\s*וויט|אוף-וויט/],
  ['brown', /חום|חומה|אגוז|וונגה/],
  ['terracotta', /טרקוטה|חמרה/],
  ['natural', /טבעי|טבעית|ג'וט|יוטה|קש|נצרים|ראטן|במבוק/],
  ['light-wood', /אלון|עץ\s*בהיר|אשוח|ליבנה/],
  ['sage', /מרווה|ירוק\s*זית|זית/],
  ['navy', /נייבי|כחול\s*כהה/],
  ['gold', /זהב|מוזהב|פליז|גולד/],
  ['green', /ירוק|ירוקה/],
  ['mustard', /חרדל/],
];

export function extractColors(text: string): string[] {
  return COLOR_RULES.filter(([, pattern]) => pattern.test(text)).map(([color]) => color);
}

const STYLE_RULES: [Style, RegExp][] = [
  ['scandinavian', /סקנדינבי|נורדי/],
  ['boho', /בוהו|בוהמי/],
  ['japandi', /יפני|ג'פנדי|וואבי/],
  ['rustic', /כפרי|רוסטיק|עץ\s*ממוחזר/],
  ['luxury', /יוקרתי|יוקרה|קטיפה|שיש/],
  ['classic', /קלאסי|וינטג'|וינטג׳/],
  ['minimalist', /מינימליסטי|מינימליסטית/],
  ['modern', /מודרני|מודרנית|עכשווי/],
];

export function extractStyles(text: string): Style[] {
  return STYLE_RULES.filter(([, pattern]) => pattern.test(text)).map(([style]) => style);
}
