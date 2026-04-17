// Screen 2.8 - Summary / Results
import { useState, useRef, useEffect } from 'react';
import type React from 'react';
import type { AgentResponse, ShareEvent, ProgramClick } from '../types';
import { sendSessionEndBeacon } from '../utils/agent';
import { config } from '../config';
import { useViewport } from '../hooks/useViewport';

interface Props {
  agentResponse: AgentResponse;
  firstName: string;
  runId: string;
  isMuted: boolean;
  onMuteToggle: () => void;
}

interface Accordion {
  title: string;
  body: string;
  open: boolean;
}


function parseAccordions(markdown: string): Accordion[] {
  const lines = markdown.split('\n');
  const result: Accordion[] = [];
  let current: Accordion | null = null;
  for (const line of lines) {
    // Match **bold** at start of line (with optional leading whitespace)
    const boldMatch = line.match(/^\s*\*\*(.+?)\*\*/);
    if (boldMatch) {
      if (current) result.push(current);
      current = { title: boldMatch[1], body: '', open: false };
    } else if (current) {
      current.body += (current.body ? '\n' : '') + line;
    }
  }
  if (current) result.push(current);
  return result;
}

function renderBold(line: string): React.ReactNode {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}

function RawTextBlock({ markdown }: { markdown: string }) {
  return (
    <div style={{ color: '#444', lineHeight: 1.6, direction: 'rtl', textAlign: 'right', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
      {markdown.split('\n').filter(Boolean).map((line, li) => (
        <p key={li} className="mb-2">{renderBold(line)}</p>
      ))}
    </div>
  );
}

function ShareBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label}
      style={{ background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.7'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
    >{children}</button>
  );
}

function AccordionItem({ acc, onToggle, isMobile }: { acc: Accordion; onToggle: () => void; isMobile: boolean }) {
  return (
    // direction: rtl here is inherited by all children — keeps text RTL without affecting parent layout
    <div style={{ direction: 'rtl', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', background: '#fff', border: '1.5px solid #ccc' }}>
      <button
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '10px 12px' : '14px 18px',
          fontSize: 'clamp(0.82rem, 1.8vw, 1rem)', color: '#1a1a2e', fontFamily: 'var(--font-heading)',
          background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold',
          direction: 'rtl',
        }}
        onClick={onToggle}
        aria-expanded={acc.open}
      >
        <span style={{ textAlign: 'right' }}>{acc.title}</span>
        <span style={{ transform: acc.open ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', fontSize: 16, color: '#4a90c4', flexShrink: 0, marginRight: 8 }}>&#9660;</span>
      </button>
      <div style={{ display: 'grid', gridTemplateRows: acc.open ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s ease', overflow: 'hidden' }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ color: '#444', lineHeight: 1.6, padding: isMobile ? '0 12px 10px' : '0 18px 14px', textAlign: 'right', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            {acc.body.split('\n').filter(Boolean).map((line, li) => <p key={li} className="mb-2">{renderBold(line)}</p>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SummaryScreen({ agentResponse, firstName, runId, isMuted, onMuteToggle }: Props) {
  const [accordions, setAccordions] = useState<Accordion[]>(() =>
    parseAccordions(agentResponse.programsMarkdown)
  );
  const [showExtra, setShowExtra] = useState(false);
  const [extraAccordions, setExtraAccordions] = useState<Accordion[]>(() =>
    agentResponse.extraProgramsMarkdown
      ? parseAccordions(agentResponse.extraProgramsMarkdown)
      : []
  );
  const hasExtra = extraAccordions.length > 0;
  const { isMobile } = useViewport();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // ── Tracking refs (mutations only — no re-render needed) ──────────────────
  const enteredAtRef          = useRef(Date.now());
  const scrolledToBottomRef   = useRef(false);
  const programsClickedRef    = useRef<ProgramClick[]>([]);
  const moreMatchesClickedRef = useRef(false);
  const shareEventsRef        = useRef<ShareEvent[]>([]);

  // ── Scroll tracking: bottom detection + show/hide scroll-to-top button ──────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onScroll() {
      if (!scrolledToBottomRef.current && el!.scrollTop + el!.clientHeight >= el!.scrollHeight - 60) {
        scrolledToBottomRef.current = true;
      }
      setShowScrollTop(el!.scrollTop > 220);
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // ── Session-end beacon: send results tracking on page close ───────────────
  useEffect(() => {
    function onBeforeUnload() {
      sendSessionEndBeacon({
        run_id: runId,
        status: 'session_end',
        results_time_spent_ms: Date.now() - enteredAtRef.current,
        results_scrolled_to_bottom: scrolledToBottomRef.current,
        programs_clicked: programsClickedRef.current,
        more_matches_clicked: moreMatchesClickedRef.current,
        share_events: shareEventsRef.current,
      });
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [runId]);

  // ── Always start at top when arriving at summary screen ──────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      scrollRef.current.scrollLeft = 0; // reset any RTL scroll offset on iOS Safari
    }
  }, []);

  function toggleAccordion(i: number) {
    setAccordions(prev => prev.map((a, idx) => idx === i ? { ...a, open: !a.open } : a));
  }
  function toggleExtra(i: number) {
    setExtraAccordions(prev => prev.map((a, idx) => idx === i ? { ...a, open: !a.open } : a));
  }

  // ── Program click tracking ────────────────────────────────────────────────
  function trackProgramClick(programId: string, position: number) {
    programsClickedRef.current.push({ programId, position, timestamp: Date.now() });
  }

  // ── Share tracking helpers ────────────────────────────────────────────────
  function withUtm(url: string, utm: string): string {
    const sep = url.includes('?') ? '&' : '?';
    return url + sep + 'utm_source=' + utm;
  }

  function trackShare(platform: string) {
    shareEventsRef.current.push({ platform, timestamp: Date.now() });
  }

  function openShare(url: string) { window.open(url, '_blank', 'noopener'); }

  const shareText = `גיליתי את הפרופיל המקצועי שלי ב-GrowApp Studio! ${agentResponse.enginesText.slice(0, 100)}...`;
  const shareUrl  = window.location.href;

  function emailShare() {
    trackShare('email');
    const s = encodeURIComponent('הפרופיל המקצועי שלי מ-GrowApp Studio');
    const b = encodeURIComponent(shareText + '\n\n' + withUtm(shareUrl, 'email'));
    window.location.href = 'mailto:?subject=' + s + '&body=' + b;
  }

  const firstBatch = accordions;

  // ── Render accordion list — mobile: single column; desktop: two independent flex columns ──
  function renderAccordionColumns(
    items: Accordion[],
    keyPrefix: string,
    onToggle: (i: number) => void,
    positionOffset: number,
  ) {
    if (isMobile) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          {items.map((acc, i) => (
            <AccordionItem
              key={keyPrefix + i}
              acc={acc}
              isMobile={isMobile}
              onToggle={() => { if (!acc.open) trackProgramClick(acc.title, positionOffset + i); onToggle(i); }}
            />
          ))}
        </div>
      );
    }
    // Desktop: two completely independent flex columns — opening one never shifts the other
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', direction: 'rtl' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.filter((_, i) => i % 2 === 0).map((acc, colIdx) => {
            const origIdx = colIdx * 2;
            return (
              <AccordionItem
                key={keyPrefix + origIdx}
                acc={acc}
                isMobile={isMobile}
                onToggle={() => { if (!acc.open) trackProgramClick(acc.title, positionOffset + origIdx); onToggle(origIdx); }}
              />
            );
          })}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.filter((_, i) => i % 2 !== 0).map((acc, colIdx) => {
            const origIdx = colIdx * 2 + 1;
            return (
              <AccordionItem
                key={keyPrefix + origIdx}
                acc={acc}
                isMobile={isMobile}
                onToggle={() => { if (!acc.open) trackProgramClick(acc.title, positionOffset + origIdx); onToggle(origIdx); }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    // Root: LTR scroll container — no direction:rtl to avoid iOS RTL scroll offset
    <div
      ref={scrollRef}
      className="screen-fade"
      style={{
        position: 'fixed', inset: 0,
        overflowY: 'auto', overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        background: '#F8F7F4',
        fontFamily: 'var(--font-body)',
        direction: 'ltr', // Explicit LTR on scroll container — prevents iOS Safari RTL scrollLeft offset
      }}
    >

      {/* Banner — full width, natural height */}
      <img
        src={config.bannerSrc}
        alt="banner"
        style={{ display: 'block', width: '100%', maxWidth: '100%', height: 'auto' }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />

      {/* Content — LTR container, individual elements carry direction:rtl */}
      <div style={{
        width: '100%', maxWidth: '56rem', margin: '0 auto',
        boxSizing: 'border-box',
        padding: isMobile ? '0 20px' : '0 56px',
        overflow: 'hidden',
      }}>

        {/* Logo row — logo only, right-aligned */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: isMobile ? 8 : 14, marginBottom: isMobile ? 4 : 8 }}>
          <img
            src={config.logoSrc}
            alt={config.logoAlt}
            style={{ maxHeight: isMobile ? 56 : 120, maxWidth: '50%', width: 'auto' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        {/* Title */}
        <h1
          className="font-bold"
          style={{
            fontFamily: 'var(--font-heading)',
            color: '#1a1a2e',
            direction: 'rtl',
            textAlign: 'center',
            marginTop: isMobile ? 12 : 20,
            marginBottom: isMobile ? 5 : 16,
            fontSize: 'clamp(1.05rem, 3.5vw, 1.75rem)',
            lineHeight: 1.3,
          }}
        >
          {agentResponse.pageTitle}
        </h1>

        {/* Greeting */}
        <p className="font-bold" style={{ direction: 'rtl', textAlign: 'right', color: '#1a1a2e', fontSize: isMobile ? '0.95rem' : '1.05rem', marginBottom: isMobile ? 5 : 16 }}>
          היי {firstName}
        </p>

        {/* Analysis text — split on newlines so agent multi-paragraph text renders correctly */}
        <div style={{ direction: 'rtl', textAlign: 'right', color: '#333', fontSize: isMobile ? '0.95rem' : '1.05rem', marginBottom: isMobile ? 10 : 24, wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.65 }}>
          {agentResponse.enginesText.split('\n').filter(Boolean).map((line, i) => (
            <p key={i} style={{ marginBottom: '0.5em' }}>{line}</p>
          ))}
        </div>

        {/* Programs title */}
        <h2 className="font-bold" style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'var(--font-heading)', color: '#1a1a2e', fontSize: 'clamp(0.92rem, 2vw, 1.05rem)', marginBottom: isMobile ? 14 : 16, marginTop: isMobile ? 6 : 0 }}>
          {agentResponse.programsTitle}
        </h2>

        {/* First batch of accordions */}
        {firstBatch.length > 0 ? (
          renderAccordionColumns(firstBatch, '', toggleAccordion, 0)
        ) : agentResponse.programsMarkdown ? (
          <RawTextBlock markdown={agentResponse.programsMarkdown} />
        ) : (
          <p style={{ direction: 'rtl', textAlign: 'right', color: '#888', fontSize: isMobile ? '0.9rem' : '0.95rem', lineHeight: 1.6 }}>
            לפרטים על תוכניות הלימוד המתאימות, ניתן לפנות ישירות למוסד.
          </p>
        )}

        {/* "יש עוד התאמות" button */}
        {hasExtra && !showExtra && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
            <button
              onClick={() => { moreMatchesClickedRef.current = true; setShowExtra(true); }}
              style={{
                background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 999,
                padding: isMobile ? '10px 22px' : '12px 28px',
                fontWeight: 'bold', cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: isMobile ? '0.88rem' : '0.95rem',
              }}
            >
              יש עוד התאמות בשבילך ↓
            </button>
          </div>
        )}
        {hasExtra && showExtra && (
          <>
            {extraAccordions.length > 0 ? (
              <div style={{ marginTop: 12 }}>
                {renderAccordionColumns(extraAccordions, 'extra-', toggleExtra, accordions.length)}
              </div>
            ) : (
              <RawTextBlock markdown={agentResponse.extraProgramsMarkdown!} />
            )}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
              <button
                onClick={() => setShowExtra(false)}
                style={{
                  background: 'transparent', color: '#4a90c4', border: '2px solid #4a90c4',
                  borderRadius: 999, padding: isMobile ? '8px 20px' : '10px 24px',
                  fontWeight: 'bold', cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                }}
              >
                ↑ סגור התאמות נוספות
              </button>
            </div>
          </>
        )}

        {/* Disclaimer — above share on mobile */}
        {isMobile && (
          <p style={{ fontSize: 10, color: '#aaa', textAlign: 'right', direction: 'rtl', marginTop: 20, marginBottom: 0 }}>
            *המשחק ותוצאותיו אינן מחליפות ייעוץ מעמיק
          </p>
        )}

        {/* Share row */}
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <p style={{ fontSize: '0.88rem', color: '#888', fontWeight: 500 }}>שתפו את הפרופיל שלכם</p>
          <div style={{ display: 'flex', gap: isMobile ? 8 : 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <ShareBtn label="שתף בפייסבוק" onClick={() => {
              trackShare('facebook');
              openShare('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(withUtm(shareUrl, 'facebook')));
            }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </ShareBtn>
            <ShareBtn label="שתף בוואטסאפ" onClick={() => {
              trackShare('whatsapp');
              openShare('https://wa.me/?text=' + encodeURIComponent(shareText + ' ' + withUtm(shareUrl, 'whatsapp')));
            }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            </ShareBtn>
            <ShareBtn label="שתף בלינקדאין" onClick={() => {
              trackShare('linkedin');
              openShare('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(withUtm(shareUrl, 'linkedin')));
            }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </ShareBtn>
            <ShareBtn label="שתף באינסטגרם" onClick={() => {
              trackShare('instagram');
              openShare('https://www.instagram.com/');
            }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </ShareBtn>
            <ShareBtn label="שתף בטיקטוק" onClick={() => {
              trackShare('tiktok');
              openShare('https://www.tiktok.com/');
            }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.87a8.27 8.27 0 004.84 1.55V7a4.85 4.85 0 01-1.07-.31z"/></svg>
            </ShareBtn>
            <ShareBtn label="שתף במייל" onClick={emailShare}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
            </ShareBtn>
          </div>
        </div>

        {/* Desktop disclaimer */}
        {!isMobile && (
          <p style={{ fontSize: 11, color: '#aaa', textAlign: 'right', direction: 'rtl', marginTop: 20 }}>
            *המשחק ותוצאותיו אינן מחליפות ייעוץ מעמיק
          </p>
        )}

        {/* Mute button — scrolls with content, at bottom-right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button
            onClick={onMuteToggle}
            aria-label={isMuted ? 'הפעל מוזיקה' : 'השתק מוזיקה'}
            style={{
              background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: '50%',
              width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {isMuted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" width={20} height={20}>
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" width={20} height={20}>
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
            )}
          </button>
        </div>

        {/* Powered by — static at bottom of scroll content, NOT fixed/sticky */}
        <div style={{ textAlign: 'center', padding: '12px 0 32px', fontSize: 11, color: '#aaa' }}>
          Powered by GrowAppMojo
        </div>

      </div>

      {/* Scroll-to-top — fixed, icon-only, appears after scrolling down */}
      {showScrollTop && (
        <button
          onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="חזרה לראש הדף"
          style={{
            position: 'fixed',
            bottom: isMobile ? 20 : 28,
            right: isMobile ? 16 : 24,
            zIndex: 50,
            background: '#1a1a2e',
            border: 'none',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,0,0,0.22)',
            opacity: 0.88,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width={18} height={18}>
            <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}
