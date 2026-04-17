// ── GrowApp Studio — Client Config ──────────────────────────────────────────
// ⚠️  החלפת לקוח = שינוי קובץ זה בלבד. אין לשנות שאר הקוד.
// ─────────────────────────────────────────────────────────────────────────────
import type { PixelConfig } from './types';

export const config: {
  clientId: string;
  institutionName: string;
  logoSrc: string;
  logoAlt: string;
  bannerSrc: string;
  exhibitions: { id: string; label: string; image: string }[];
  supabaseUrl: string;
  supabaseAnonKey: string;
  agentEndpoint: string;
  agentSecret: string;
  agentTimeoutSeconds: number;
  system_version: string;
  features: { chatWidget: boolean };
  pixels: PixelConfig[];
} = {
  // מזהה הלקוח
  clientId: 'tau',
  institutionName: 'אוניברסיטת תל אביב',

  // לוגו
  logoSrc: '/assets/logo/logo_tau.png',
  logoAlt: 'לוגו אוניברסיטת תל אביב',

  // באנר מסך הניתוח
  bannerSrc: '/assets/summary/banner.webp',

  // תערוכות — מותאם לפקולטות TAU
  exhibitions: [
    { id: 'tech',    label: 'טכנולוגיה והעולם של מחר',  image: '/assets/gallery/tech.webp'   },
    { id: 'arts',    label: 'יצירה, דמיון וביטוי עצמי', image: '/assets/gallery/arts.webp'   },
    { id: 'social',  label: 'אנשים, סיפורים ותרבות',    image: '/assets/gallery/social.webp' },
    { id: 'science', label: 'היקום',                     image: '/assets/gallery/space.webp'  },
  ],

  // Supabase (יוחלף לפי לקוח)
  supabaseUrl: '',
  supabaseAnonKey: '',

  // Agent endpoint — local dev: http://localhost:3001 | production: Railway URL
  agentEndpoint: import.meta.env.VITE_AGENT_ENDPOINT ?? 'https://growapp-agent-production.up.railway.app',
  agentSecret: 'GrowAppMojo',
  // Timeout לסוכן: שלב 1 (hint) תמיד 30s, שלב 2 (error screen) לפי ערך זה
  agentTimeoutSeconds: 90,
  // גרסת מערכת — נשמרת ב-Supabase per session, עודכן כאן בלבד
  system_version: '1.0',

  // Feature flags
  features: {
    chatWidget: false,
  },

  // Pixel tracking
  pixels: [
    // { type: 'facebook', pixelId: '123456789012345', enabled: false },
  ],
};
