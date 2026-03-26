# SPEC: מחנה הישרדות – משחק מדידה פסיכולוגית פיננסית

## סקירה כללית

משחק הישרדות מבוסס בחירות (15 שאלות) שמודד 4 מדדים פסיכולוגיים מבלי שהשחקן יודע שנבחן. המשחק מסתיים במסך תוצאות עם פרופיל + המלצה פיננסית מותאמת אישית.

---

## Tech Stack

```
Framework:     React + Vite
Styling:       Tailwind CSS + CSS custom animations
Language:      TypeScript
State:         useState / useReducer (ללא Redux)
Backend:       Supabase (שמירת תוצאות)
Deploy:        Netlify
Assets:        Emoji + CSS gradients (Phase 1), תמונות Midjourney (Phase 2)
```

---

## מבנה תיקיות

```
/src
  /components
    TitleScreen.tsx
    GameScreen.tsx
    TopDownScene.tsx
    CharacterSprite.tsx
    ToolItem.tsx
    ProgressBar.tsx
    ResultsScreen.tsx
    MetricBar.tsx
  /data
    missions.ts         ← כל 15 המשימות
    scoring.ts          ← לוגיקת חישוב מדדים
  /hooks
    useGameState.ts
    useTimer.ts
  /types
    index.ts
  /lib
    supabase.ts
  App.tsx
  main.tsx
```

---

## Data Types

```typescript
// types/index.ts

export type Metric = 'risk' | 'fomo' | 'stability' | 'impulsivity';
export type Background = 
  'forest' | 'forest_evening' | 'forest_night' | 
  'camp' | 'camp_night' | 
  'river' | 'river_hot' | 
  'open' | 'open_night' | 
  'mountain';

export interface Tool {
  emoji: string;
  label: string;
  desc: string;
  score: 0 | 1 | 2;   // 0=בטוח, 1=ביניים, 2=מסוכן/חד-פעמי
  x: number;           // % מיקום בסצנה (0-100)
  y: number;           // % מיקום בסצנה (0-100)
}

export interface Decor {
  emoji: string;
  x: number;
  y: number;
}

export interface Mission {
  id: number;
  bg: Background;
  icon: string;
  title: string;
  text: string;        // הנעה לפעולה – מה השחקן צריך לעשות ולמה
  tools: [Tool, Tool, Tool];  // תמיד בדיוק 3 כלים
  metric: Metric;
  decor: Decor[];
}

export interface GameAnswer {
  missionId: number;
  toolScore: 0 | 1 | 2;
  timeMs: number;      // זמן בחירה במילי-שניות
}

export interface GameScores {
  risk: number;        // 0-2
  fomo: number;        // 0-2
  stability: number;   // 0-2 (גבוה = יציב)
  impulsivity: number; // 0-2
}

export type GameScreen = 'title' | 'game' | 'calculating' | 'results';
```

---

## נתוני המשימות (missions.ts)

```typescript
export const MISSIONS: Mission[] = [
  {
    id: 1, bg: "forest_evening", icon: "⛺", title: "בניית מחסה", metric: "risk",
    text: "רצת 3 שעות. הרגליים כבדות, הגב כואב. לפנות ערב – אחרת לילה בקור עם גשם. מה בונים?",
    tools: [
      { emoji: "🪵", label: "קורות עץ מהקרקע", desc: "יציב, לוקח זמן", score: 0, x: 14, y: 68 },
      { emoji: "🌿", label: "ענפי שיח צפופים", desc: "מהיר, פחות חזק", score: 1, x: 52, y: 58 },
      { emoji: "🪢", label: "ניילון על עץ גבוה", desc: "יכסה הכי הרבה – תלוי ברוח", score: 2, x: 80, y: 24 },
    ],
    decor: [{ emoji: "🌲", x: 5, y: 8 }, { emoji: "🌳", x: 88, y: 6 }, { emoji: "🌲", x: 65, y: 10 }, { emoji: "☁️", x: 35, y: 5 }],
  },
  {
    id: 2, bg: "river", icon: "💧", title: "מים", metric: "stability",
    text: "8 שעות בלי שתייה. הראש מסתחרר והפה יבש. שלושה מקורות מים לפניך – מה שותים עכשיו?",
    tools: [
      { emoji: "🪨", label: "מעיין סלעי זורם", desc: "בטוח, קצת רחוק", score: 0, x: 14, y: 40 },
      { emoji: "🌊", label: "נחל עכור שוצף", desc: "קרוב, מים לא ברורים", score: 1, x: 50, y: 65 },
      { emoji: "🌿", label: "טל על עלים רחבים", desc: "טהור לגמרי – ייעלם בדקות!", score: 2, x: 80, y: 72 },
    ],
    decor: [{ emoji: "🌊", x: 30, y: 70 }, { emoji: "🌊", x: 60, y: 75 }, { emoji: "🌿", x: 5, y: 60 }, { emoji: "🪨", x: 85, y: 55 }],
  },
  {
    id: 3, bg: "forest", icon: "🍽️", title: "אוכל", metric: "fomo",
    text: "הבטן קורצת, יומיים בלי אוכל. פתאום להקת ציפורים גדולה נחתה 20 מטר ממך. בעוד דקה הן עפות. מה עושים?",
    tools: [
      { emoji: "🍄", label: "פטריות בטוחות", desc: "מוכר, זמין", score: 0, x: 18, y: 72 },
      { emoji: "🐛", label: "חרקים מתחת לאבן", desc: "מהיר, לא טעים", score: 1, x: 50, y: 65 },
      { emoji: "🦅", label: "מלכודת לציפורים", desc: "פרוטאין אמיתי – עוזבות עכשיו!", score: 2, x: 75, y: 32 },
    ],
    decor: [{ emoji: "🌲", x: 5, y: 5 }, { emoji: "🌳", x: 85, y: 8 }, { emoji: "🍃", x: 40, y: 6 }, { emoji: "🌲", x: 60, y: 12 }],
  },
  {
    id: 4, bg: "camp_night", icon: "🔥", title: "הצתת אש", metric: "risk",
    text: "הטמפרטורה צנחה. האצבעות מאבדות תחושה. בלי אש הלילה יהיה קשה מאוד. מה מציתים?",
    tools: [
      { emoji: "🔥", label: "צור + קש יבש", desc: "לוקח 10 דקות, בטוח", score: 0, x: 18, y: 70 },
      { emoji: "🌿", label: "חיכוך שני עצים", desc: "לא בטוח שיצא אש, מייגע", score: 1, x: 50, y: 60 },
      { emoji: "⚡", label: "חוט חשמל ממטוס", desc: "יצית מיד – אחד בלבד!", score: 2, x: 80, y: 28 },
    ],
    decor: [{ emoji: "🌑", x: 85, y: 5 }, { emoji: "⭐", x: 20, y: 8 }, { emoji: "⭐", x: 60, y: 6 }, { emoji: "🪨", x: 40, y: 72 }],
  },
  {
    id: 5, bg: "open_night", icon: "🧭", title: "ניווט", metric: "impulsivity",
    text: "הלכת 2 שעות ולא מכיר את השטח. חשיכה בעוד 40 דקות. פתאום שומעים רעש מטוס מעל. מה עושים?",
    tools: [
      { emoji: "⭐", label: "כוכב הצפון", desc: "איטי, אמין לחלוטין", score: 0, x: 22, y: 18 },
      { emoji: "🌊", label: "קול נחל שנשמע", desc: "לא בטוח לאן", score: 1, x: 50, y: 70 },
      { emoji: "🛩️", label: "ריצה אחרי מטוס", desc: "ייעלם בשניות – אולי מוביל לעיר!", score: 2, x: 80, y: 20 },
    ],
    decor: [{ emoji: "🌙", x: 10, y: 5 }, { emoji: "⭐", x: 50, y: 8 }, { emoji: "⭐", x: 75, y: 12 }, { emoji: "⭐", x: 30, y: 15 }],
  },
  {
    id: 6, bg: "river", icon: "🌊", title: "חצייה", metric: "risk",
    text: "המסלול חוצה נחל. המים זורמים חזק אחרי הגשמים. לחכות שעות – או לעבור עכשיו. מה הדרך?",
    tools: [
      { emoji: "🌉", label: "גשר עצים ישן", desc: "יציב, עיקוף של 20 דקות", score: 0, x: 12, y: 42 },
      { emoji: "🪨", label: "קפיצה על אבנים", desc: "זמין, מים קרים אם נופלים", score: 1, x: 50, y: 62 },
      { emoji: "🌿", label: "גפן עבה תלויה", desc: "מהיר – תלוי בחוזק הגפן", score: 2, x: 80, y: 28 },
    ],
    decor: [{ emoji: "🌊", x: 25, y: 68 }, { emoji: "🌊", x: 55, y: 72 }, { emoji: "🌿", x: 88, y: 45 }, { emoji: "🪨", x: 38, y: 58 }],
  },
  {
    id: 7, bg: "camp", icon: "🩹", title: "פציעה", metric: "stability",
    text: "נחתכת מסלע חד – הפצע שוטף דם. צריך לעצור את זה לפני שממשיכים. מה משתמשים?",
    tools: [
      { emoji: "🧴", label: "בד נקי מהתרמיל", desc: "בטוח, זמין", score: 0, x: 18, y: 70 },
      { emoji: "🌿", label: "עלי רפא מהיער", desc: "טבעי, לא בדוק אישית", score: 1, x: 50, y: 60 },
      { emoji: "🕸️", label: "קורי עכביש עבים", desc: "עוצרים דם מהר – סיכון זיהום", score: 2, x: 80, y: 42 },
    ],
    decor: [{ emoji: "🌲", x: 5, y: 8 }, { emoji: "⛺", x: 40, y: 15 }, { emoji: "🪨", x: 78, y: 65 }, { emoji: "🌳", x: 88, y: 5 }],
  },
  {
    id: 8, bg: "open", icon: "🚁", title: "אות מצוקה", metric: "fomo",
    text: "שמעתם מסוק! 30 שניות לפני שייעלם מהאופק. זו ההזדמנות הראשונה לאות מצוקה. מה משתמשים?",
    tools: [
      { emoji: "🔥", label: "עשן מהאש הקיימת", desc: "בטוח, נראה טוב", score: 0, x: 20, y: 68 },
      { emoji: "🪞", label: "מראה קטנה", desc: "פלאש ישיר לטייס", score: 1, x: 50, y: 62 },
      { emoji: "🧨", label: "זיקוק יחיד", desc: "הכי נראה מרחוק – לא יהיה שני!", score: 2, x: 80, y: 35 },
    ],
    decor: [{ emoji: "☁️", x: 15, y: 8 }, { emoji: "☁️", x: 60, y: 5 }, { emoji: "🌿", x: 5, y: 65 }, { emoji: "🌿", x: 88, y: 70 }],
  },
  {
    id: 9, bg: "river_hot", icon: "🌡️", title: "קירור", metric: "stability",
    text: "אחר הצהריים, 36 מעלות. מתחיל להרגיש כבד ורדום – סימן ראשוני לפגיעת חום. חייבים להתקרר. איך?",
    tools: [
      { emoji: "🌊", label: "כניסה מדורגת לנחל", desc: "בטוח, יעיל", score: 0, x: 50, y: 72 },
      { emoji: "🌲", label: "שכיבה בצל עץ גדול", desc: "פשוט, לא מספיק", score: 1, x: 20, y: 50 },
      { emoji: "💨", label: "עלייה לצוק ברוח", desc: "הכי מהיר – גובה + קצוות לא ברורים", score: 2, x: 82, y: 22 },
    ],
    decor: [{ emoji: "☀️", x: 80, y: 5 }, { emoji: "🌊", x: 30, y: 72 }, { emoji: "🌊", x: 65, y: 68 }, { emoji: "🌿", x: 5, y: 55 }],
  },
  {
    id: 10, bg: "forest_night", icon: "🌙", title: "לינה", metric: "risk",
    text: "שעה לפני חשיכה. צריך לבחור מקום לינה לפני שלא רואים כלום. איפה ישנים?",
    tools: [
      { emoji: "🏕️", label: "קרקעית עמק מוגנת", desc: "ישיר, מוגן, קצת לח", score: 0, x: 45, y: 75 },
      { emoji: "🌲", label: "בין שני עצים", desc: "מוגבה, יציב", score: 1, x: 22, y: 52 },
      { emoji: "🌳", label: "ענף גבוה 4 מטר", desc: "מחוץ לטווח חיות – נדרשת טיפוס", score: 2, x: 78, y: 20 },
    ],
    decor: [{ emoji: "🌑", x: 82, y: 5 }, { emoji: "⭐", x: 20, y: 8 }, { emoji: "🌲", x: 5, y: 10 }, { emoji: "🌲", x: 88, y: 8 }],
  },
  {
    id: 11, bg: "open", icon: "📱", title: "סוללה 3%", metric: "fomo",
    text: "הטלפון מתחת ל-3%. פעולה אחת לפני שנכבה. מה הכי שווה עכשיו?",
    tools: [
      { emoji: "📍", label: "שליחת מיקום GPS", desc: "בטוח, ממשיכים לחפש אותך", score: 0, x: 20, y: 65 },
      { emoji: "📞", label: "שיחה לחדר מצב", desc: "ישיר, אנושי", score: 1, x: 52, y: 65 },
      { emoji: "🔦", label: "SOS מהבהב", desc: "ייראה ממרחק רב – לא נדע אם נראה", score: 2, x: 80, y: 55 },
    ],
    decor: [{ emoji: "☁️", x: 30, y: 5 }, { emoji: "☁️", x: 70, y: 8 }, { emoji: "🌿", x: 5, y: 68 }, { emoji: "🌿", x: 90, y: 65 }],
  },
  {
    id: 12, bg: "river", icon: "🐻", title: "דב מתקרב", metric: "impulsivity",
    text: "פתאום – רשרוש כבד מהשיחים. דב גדול יוצא 15 מטר ממך ומסתכל. 3 שניות להחליט.",
    tools: [
      { emoji: "🧍", label: "לעמוד בשקט", desc: "מה שמלמדים, עובד", score: 0, x: 50, y: 75 },
      { emoji: "🗣️", label: "לצעוק ולהגדיל גוף", desc: "אגרסיבי, לא בטוח", score: 1, x: 20, y: 62 },
      { emoji: "🪨", label: "השלך אבנים + רוץ לעץ", desc: "פעולה מיידית – דובים מטפסים!", score: 2, x: 80, y: 38 },
    ],
    decor: [{ emoji: "🐻", x: 10, y: 38 }, { emoji: "🌊", x: 40, y: 70 }, { emoji: "🌿", x: 85, y: 55 }, { emoji: "🪨", x: 65, y: 60 }],
  },
  {
    id: 13, bg: "camp_night", icon: "🔥", title: "האש דועכת", metric: "risk",
    text: "האש דועכת. עוד שעה יחשיך ובלי אש אין חום ואין הגנה. מה זורקים פנימה?",
    tools: [
      { emoji: "🪵", label: "עצים יבשים שאספת", desc: "אמין, מחזיק זמן", score: 0, x: 18, y: 70 },
      { emoji: "🌿", label: "ענפי שיח לחים", desc: "עשן רב, להבה חלשה", score: 1, x: 50, y: 62 },
      { emoji: "🛢️", label: "פחית אירוסול ישנה", desc: "תלהב מיידית וחזק – אחת בלבד", score: 2, x: 80, y: 44 },
    ],
    decor: [{ emoji: "🌑", x: 85, y: 5 }, { emoji: "⭐", x: 25, y: 8 }, { emoji: "⭐", x: 55, y: 6 }, { emoji: "🌲", x: 5, y: 10 }],
  },
  {
    id: 14, bg: "mountain", icon: "🗺️", title: "יום שני", metric: "stability",
    text: "בוקר שני. אין אות טלפון. לא יודעים אם מחפשים אותך. מה ההחלטה הגדולה?",
    tools: [
      { emoji: "⛺", label: "להישאר במחנה", desc: "כל הכללים אומרים כך", score: 0, x: 25, y: 70 },
      { emoji: "🗺️", label: "לפי סימני שטח", desc: "יוזמה, לא בטוח לאן", score: 1, x: 52, y: 60 },
      { emoji: "🏔️", label: "לטפס להר לסקירה", desc: "תמונה שלמה – 4 שעות, יכול לאבד כיוון", score: 2, x: 80, y: 28 },
    ],
    decor: [{ emoji: "⛰️", x: 70, y: 5 }, { emoji: "🌲", x: 8, y: 10 }, { emoji: "🪨", x: 45, y: 65 }, { emoji: "🌥️", x: 35, y: 6 }],
  },
  {
    id: 15, bg: "open", icon: "🚁", title: "מסוק באופק", metric: "fomo",
    text: "מסוק חילוץ נראה באופק – אולי רואה אותך, אולי לא. זה הרגע. מה עושים?",
    tools: [
      { emoji: "🔥", label: "עשן + ידיים מנופפות", desc: "מה שעשית עד עכשיו", score: 0, x: 20, y: 65 },
      { emoji: "🏃", label: "ריצה לשטח פתוח", desc: "נראה יותר, מתיש", score: 1, x: 52, y: 68 },
      { emoji: "🧨", label: "זיקוק אחרון שנשמר", desc: "הכי נראה – חד-פעמי, הכל על קלף אחד!", score: 2, x: 80, y: 40 },
    ],
    decor: [{ emoji: "🚁", x: 75, y: 5 }, { emoji: "☁️", x: 20, y: 6 }, { emoji: "🌿", x: 5, y: 68 }, { emoji: "🌿", x: 90, y: 65 }],
  },
];
```

---

## לוגיקת חישוב מדדים (scoring.ts)

```typescript
export function calculateScores(answers: GameAnswer[]): GameScores {
  const getAvg = (missionIds: number[]) => {
    const relevant = answers.filter(a => missionIds.includes(a.missionId));
    if (relevant.length === 0) return 0;
    return relevant.reduce((sum, a) => sum + a.toolScore, 0) / relevant.length;
  };

  const risk       = getAvg([1, 4, 6, 10, 13]);
  const fomo       = getAvg([3, 8, 11, 15]);
  const stabilityRaw = getAvg([2, 7, 9, 14]);
  const stability  = 2 - stabilityRaw; // הפוך: כלי0=יציבות גבוהה

  // אימפולסיביות = ממוצע + בונוס על בחירה מהירה (<3s) במשימות הרלוונטיות
  const impulseBase = getAvg([5, 12]);
  const fastChoices = answers
    .filter(a => [5, 12].includes(a.missionId) && a.timeMs < 3000)
    .length;
  const impulsivity = Math.min(2, impulseBase + fastChoices * 0.3);

  return { risk, fomo, stability, impulsivity };
}

export function getScoreLevel(value: number): 'low' | 'medium' | 'high' {
  if (value < 0.67) return 'low';
  if (value < 1.34) return 'medium';
  return 'high';
}

export function getStabilityLabel(value: number): 'calm' | 'balanced' | 'adventurous' {
  if (value > 1.34) return 'calm';
  if (value > 0.67) return 'balanced';
  return 'adventurous';
}

export function getFinancialRecommendation(scores: GameScores): string {
  if (scores.risk > 1.3 && scores.fomo > 1.3)
    return 'מחפש הזדמנויות – מתאים להשקעות צמיחה, אבל חשוב להגדיר עצירות הפסד מראש.';
  if (scores.stability > 1.3 && scores.risk < 0.7)
    return 'שומר ערך – פורטפוליו סולידי עם אג"ח ומניות דיבידנד מתאים לך.';
  if (scores.impulsivity > 1.3)
    return 'מגיב מהר – כדאי לעבוד עם יועץ פיננסי שיאזן החלטות רגשיות.';
  if (scores.fomo > 1.3)
    return 'FOMO משקיע – מוטב לחכות 48 שעות לפני כניסה לכל השקעה.';
  return 'פרופיל מאוזן – תמהיל מגוון של מניות ואג"ח מתאים לך.';
}
```

---

## עיצוב ויזואלי

### צבעוניות (CSS Variables)

```css
:root {
  --bg-dark:       #070a07;
  --bg-mid:        #0d1a0d;
  --bg-panel:      #101a10;
  --border-green:  #1e3a1e;
  --accent-green:  #4aff4a;
  --accent-glow:   #4aff4a44;
  --text-primary:  #e8e8e8;
  --text-secondary:#aaaaaa;
  --text-muted:    #555555;
  --score-low:     #4aff88;
  --score-mid:     #ffcc44;
  --score-high:    #ff5555;
}
```

### רקעי Top-Down (CSS Gradients)

```typescript
export const BACKGROUNDS: Record<Background, string> = {
  forest:         "linear-gradient(180deg, #0d2b0d 0%, #1a4a16 50%, #2d6b24 100%)",
  forest_evening: "linear-gradient(180deg, #1a0d00 0%, #2d1a08 30%, #1a4a16 70%, #2d6b24 100%)",
  forest_night:   "linear-gradient(180deg, #020a02 0%, #071407 50%, #0d2b0d 100%)",
  camp:           "linear-gradient(180deg, #1a3a16 0%, #2d2a16 60%, #3d2a10 100%)",
  camp_night:     "linear-gradient(180deg, #040408 0%, #0a0808 50%, #1a0d00 100%)",
  river:          "linear-gradient(180deg, #0d2b1a 0%, #1a4a2d 40%, #0a2a3d 100%)",
  river_hot:      "linear-gradient(180deg, #3d2a00 0%, #2a4a1a 40%, #0a2a3d 100%)",
  open:           "linear-gradient(180deg, #1a4a7a 0%, #1e6a8a 50%, #2a7a5a 100%)",
  open_night:     "linear-gradient(180deg, #04041a 0%, #080830 50%, #0a0d1a 100%)",
  mountain:       "linear-gradient(180deg, #1a2030 0%, #2a3040 50%, #2a3020 100%)",
};
```

### פונטים

```
כותרות: 'Georgia', serif  (RTL תמיכה)
טקסט:   system-ui, sans-serif
```

---

## מסכים

### מסך 1: Title Screen

```
רקע: forest_night gradient + כוכבים מצוירי CSS
מרכז:
  🏕️ (72px)
  "מחנה הישרדות" – H1 ירוק זוהר עם text-shadow
  "15 החלטות מהירות. אין תשובות נכונות. רק הבחירות שלך."
  סטטיסטיקות: ⏱️ 4–6 דקות | 🧠 4 מדדים | 💰 המלצה פיננסית
  כפתור "▶ התחל משימה" – ירוק כהה עם hover effect
```

### מסך 2: Game Screen (לכל משימה)

**מבנה:**
```
┌─────────────────────────────┐
│  Progress bar (3px, ירוק)   │
│  X/15    [icon] [title]     │
├─────────────────────────────┤
│                             │
│   TOP-DOWN SCENE (35% גובה) │
│   (רקע + עיטורים + כלים +   │
│    דמות נעה)                │
│                             │
├─────────────────────────────┤
│   טקסט הנעה לפעולה (RTL)   │
│                             │
│   [כלי 1] כפתור            │
│   [כלי 2] כפתור            │
│   [כלי 3] כפתור            │
└─────────────────────────────┘
```

**Top-Down Scene:**
- רקע gradient לפי bg
- grid overlay: `radial-gradient(circle, #ffffff06 1px, transparent 1px) 28px 28px`
- עיטורים (decor): emoji ב-absolute positioning לפי x/y %
- כלים: emoji + label קטן, ניתנים ללחיצה, מוצגים ב-x/y %
- דמות 🧍: מתחילה ב-50%,75% → נעה ל-x/y של הכלי שנבחר
- אנימציה: `transition: left 0.8s cubic-bezier(.4,0,.2,1), top 0.8s`
- vignette overlay בשחור שקוף בשוליים

**כפתורי כלים (תחתית):**
```
RTL | רקע #101a10 | border #1e3a1e | border-radius 6px
hover: background #1a2e1a, border #2d5a2d
מבנה: [emoji 1.4rem] [שם הכלי bold] [תיאור קטן ומעומעם]
disabled בזמן אנימציה
```

### מסך 3: Calculating (optional – 1.5 שניות)

```
מרכז מסך:
"מנתח את הפרופיל שלך..."
אנימציה: 4 מדדים מתמלאים בזה אחר זה
```

### מסך 4: Results Screen

```
רקע: forest_night gradient
לוגו + "הפרופיל שלך במחנה"

4 כרטיסי מדד (MetricBar):
┌────────────────────────────────┐
│ 🔴 נטיית סיכון          גבוה │
│ ████████████░░░░░░░░░░░░      │
└────────────────────────────────┘

כרטיס המלצה פיננסית:
┌────────────────────────────────┐
│ 💰 המלצה פיננסית              │
│ [טקסט המלצה מותאם אישית]     │
└────────────────────────────────┘

כפתור "↺ שחק שוב"
```

**MetricBar component:**
- progress bar מתמלא ב-CSS animation (1.2s ease)
- צבע דינמי לפי ערך: ירוק/צהוב/אדום
- glow effect על ה-bar: `box-shadow: 0 0 8px ${color}88`

---

## לוגיקת State

```typescript
// useGameState.ts
interface GameState {
  screen: GameScreen;
  missionIndex: number;
  answers: GameAnswer[];
  scores: GameScores | null;
  charPos: { x: number; y: number };
  isAnimating: boolean;
  missionStartTime: number;
}

// Actions:
// START_GAME → screen: 'game', reset all
// CHOOSE_TOOL(toolIndex) → animate char, record answer, next mission or results
// SHOW_RESULTS → screen: 'calculating' → 'results'
// RESET → חזור ל-title
```

**זרימה:**
1. שחקן בוחר כלי → `isAnimating = true`
2. דמות זזה לכלי (0.9s)
3. תשובה נרשמת עם timestamp
4. `missionIndex++` או חישוב תוצאות
5. `isAnimating = false`

---

## Supabase Integration

### Schema

```sql
CREATE TABLE game_results (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now(),
  session_id  text,
  risk        float,
  fomo        float,
  stability   float,
  impulsivity float,
  recommendation text,
  answers     jsonb,
  total_time_ms integer
);
```

### שמירה

```typescript
// שמירה אוטומטית בסוף המשחק
async function saveResult(scores: GameScores, answers: GameAnswer[]) {
  const { error } = await supabase.from('game_results').insert({
    session_id: crypto.randomUUID(),
    ...scores,
    recommendation: getFinancialRecommendation(scores),
    answers: answers,
    total_time_ms: answers.reduce((sum, a) => sum + a.timeMs, 0),
  });
  if (error) console.error('Failed to save:', error);
}
```

---

## RTL Support

```html
<!-- index.html -->
<html lang="he" dir="rtl">
```

```css
/* global */
body { direction: rtl; font-family: system-ui, sans-serif; }
.scene { direction: ltr; } /* הסצנה עצמה LTR לפי קואורדינטות */
```

---

## Responsive Design

```
Mobile first (320px+)
כפתורי כלים: padding 11px 13px, font 0.88rem
סצנה: height clamp(150px, 32vw, 240px)
emoji כלים: font-size clamp(1.4rem, 2.8vw, 2rem)
טקסט משימה: font-size clamp(0.85rem, 2vw, 0.98rem)
```

---

## Milestones

### Milestone 1 – Core Game (יום 1)
- [ ] Setup Vite + React + TypeScript + Tailwind
- [ ] `missions.ts` עם כל 15 המשימות
- [ ] `scoring.ts` עם לוגיקת חישוב
- [ ] TitleScreen component
- [ ] GameScreen עם TopDownScene
- [ ] CharacterSprite עם אנימציית תנועה
- [ ] ToolItem buttons
- [ ] ProgressBar
- [ ] מדידת זמן לכל בחירה
- [ ] ResultsScreen עם MetricBar

### Milestone 2 – Polish + Supabase (יום 2)
- [ ] Supabase setup + schema
- [ ] שמירת תוצאות אוטומטית
- [ ] מסך "מחשב..." בין משחק לתוצאות
- [ ] CSS animations: bar fill, glow effects, title entrance
- [ ] RTL בדיקה מלאה
- [ ] Mobile responsive בדיקה

### Milestone 3 – Production (יום 3)
- [ ] Deploy ל-Netlify
- [ ] Environment variables (Supabase keys)
- [ ] Error handling
- [ ] Loading states
- [ ] אנימציית כניסה לכל מסך

---

## פקודות להתחלה

```bash
# צור פרויקט
npm create vite@latest survival-game -- --template react-ts
cd survival-game
npm install
npm install @supabase/supabase-js
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# הפעל
npm run dev
```

---

## הערות חשובות

1. **אל תשנה את מבנה המשימות** – הלוגיקה הפסיכומטרית קפואה
2. **כלי3 תמיד score=2** – זה המדד העיקרי
3. **זמן מדידה חשוב** – למשימות 5 ו-12 בלבד (impulsivity)
4. **RTL חשוב** – כל הטקסט עברית, הסצנה עצמה LTR
5. **Supabase keys** – שמור ב-.env.local, לא בקוד
6. **Phase 2** – החלפת emoji בתמונות Midjourney היא שלב עתידי נפרד
