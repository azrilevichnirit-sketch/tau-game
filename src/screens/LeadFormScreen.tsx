// Screen 2.6 - Lead Form
import { useState, useEffect } from 'react';
import type { LeadData } from '../types';

interface Props {
  onSubmit: (data: LeadData) => void;
  lastBg?: string;
  isMuted: boolean;
  onMuteToggle: () => void;
}

export default function LeadFormScreen({ onSubmit, lastBg, isMuted, onMuteToggle }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptUpdates, setAcceptUpdates] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const isMobile = window.innerWidth < 768;
  const formBgSrc = isMobile
    ? '/assets/form/bg_form_mobile.webp'
    : '/assets/form/bg_form_desktop.webp';

  // Start with lastBg (prev mission's bg) if available, then crossfade to form bg
  const [bgSrc, setBgSrc] = useState(lastBg || formBgSrc);
  const [pendingBg, setPendingBg] = useState<string | null>(null);

  useEffect(() => {
    if (!lastBg || lastBg === formBgSrc) {
      setBgSrc(formBgSrc);
      return;
    }
    // Crossfade from lastBg to form bg once it's loaded
    let canceled = false;
    const img = new window.Image();
    img.onload = () => {
      if (canceled) return;
      setPendingBg(formBgSrc);
      setTimeout(() => { if (!canceled) { setBgSrc(formBgSrc); setPendingBg(null); } }, 500);
    };
    img.onerror = () => { if (!canceled) setBgSrc(formBgSrc); };
    img.src = formBgSrc;
    return () => { canceled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nameValid = fullName.trim().length >= 2 && !/^\d+$/.test(fullName.trim());
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const phoneClean = phone.replace(/-/g, '').replace(/[^\d]/g, '');
  const phoneValid = /^0[5-7]\d{7,8}$/.test(phoneClean) && phoneClean.length >= 9 && phoneClean.length <= 10;
  const formValid = nameValid && emailValid && phoneValid;

  function validate() {
    const e: Record<string, string> = {};
    if (!nameValid) e.fullName = fullName.trim() === '' ? 'שדה חובה' : 'שם לא תקין';
    if (!emailValid) e.email = email.trim() === '' ? 'שדה חובה' : 'כתובת המייל אינה תקינה';
    if (!phoneValid) e.phone = phoneClean.trim() === '' ? 'שדה חובה' : 'מספר טלפון ישראלי תקין הוא 9-10 ספרות';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handlePhoneChange(v: string) {
    const phoneClean = v.replace(/-/g, '').replace(/[^\d]/g, '');
    setPhone(phoneClean);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ fullName: true, email: true, phone: true });
    if (validate()) {
      onSubmit({ fullName: fullName.trim(), email: email.trim(), phone: phoneClean, acceptUpdates });
    }
  }

  // Compact on mobile to guarantee no-scroll fit
  function fieldStyle(field: string): React.CSSProperties {
    return {
      border: '2px solid ' + (touched[field] && errors[field] ? '#E53935' : '#ddd'),
      borderRadius: 10,
      padding: isMobile ? '7px 12px' : '10px 14px',
      width: '100%',
      fontSize: isMobile ? '0.88rem' : '1rem',
      fontFamily: 'var(--font-body)',
      direction: 'rtl',
      outline: 'none',
      transition: 'border-color 0.2s',
    };
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontWeight: 600,
    marginBottom: isMobile ? 3 : 5,
    color: '#1a1a2e',
    fontSize: isMobile ? '0.82rem' : '1rem',
  };

  return (
    // Root fills viewport exactly — no overflow, no scroll
    <div
      style={{
        position: 'fixed', inset: 0, overflow: 'hidden',
        backgroundImage: 'url(' + bgSrc + ')',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        direction: 'rtl',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Crossfade overlay — fades form bg in over lastBg */}
      {pendingBg && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: 'url(' + pendingBg + ')', backgroundSize: 'cover', backgroundPosition: 'center', animation: 'bgFade 0.5s ease forwards' }} />
      )}
      {/* Dark overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.52)', zIndex: 0 }} />

      {/* Form area: full height minus footer (44px) — form stays above it */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 44,              // clears the fixed footer + mute button area
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '8px 16px' : '24px 20px',
          zIndex: 1,
          overflowY: 'auto',        // safety: scroll only if absolutely necessary
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: '100%',
            background: 'rgba(255,255,255,0.97)',
            borderRadius: 20,
            padding: isMobile ? '14px 16px' : '24px 20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              color: '#1a1a2e',
              textAlign: 'center',
              fontSize: isMobile ? '1.05rem' : '1.5rem',
              fontWeight: 'bold',
              marginBottom: isMobile ? 4 : 8,
            }}
          >
            המשימה הושלמה והמידע נאסף
          </h1>
          <p
            style={{
              textAlign: 'center',
              color: '#666',
              marginBottom: isMobile ? 10 : 22,
              fontSize: isMobile ? '0.82rem' : '1rem',
            }}
          >
            לאן לשלוח את התוצאות שלך?
          </p>

          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 9 : 16 }}
          >
            {/* שם מלא */}
            <div>
              <label style={labelStyle}>שם מלא *</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                onBlur={() => { setTouched(t => ({ ...t, fullName: true })); validate(); }}
                style={fieldStyle('fullName')}
                autoComplete="name"
              />
              {touched.fullName && errors.fullName && (
                <p style={{ color: '#E53935', fontSize: 11, marginTop: 3 }}>{errors.fullName}</p>
              )}
            </div>

            {/* מייל */}
            <div>
              <label style={labelStyle}>מייל *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => { setTouched(t => ({ ...t, email: true })); validate(); }}
                style={fieldStyle('email')}
                autoComplete="email"
              />
              {touched.email && errors.email && (
                <p style={{ color: '#E53935', fontSize: 11, marginTop: 3 }}>{errors.email}</p>
              )}
            </div>

            {/* טלפון */}
            <div>
              <label style={labelStyle}>טלפון *</label>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={e => handlePhoneChange(e.target.value)}
                onBlur={() => { setTouched(t => ({ ...t, phone: true })); validate(); }}
                style={fieldStyle('phone')}
                autoComplete="tel"
              />
              {touched.phone && errors.phone && (
                <p style={{ color: '#E53935', fontSize: 11, marginTop: 3 }}>{errors.phone}</p>
              )}
            </div>

            {/* Checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={acceptUpdates}
                onChange={e => setAcceptUpdates(e.target.checked)}
                style={{ width: 14, height: 14 }}
              />
              <span style={{ color: '#1a1a2e', fontSize: isMobile ? '0.82rem' : '1rem' }}>
                אני רוצה לקבל עדכונים
              </span>
            </label>

            {/* Disclaimer */}
            <p style={{ fontSize: isMobile ? 10 : 11, color: '#888', textAlign: 'right', margin: 0 }}>
              * שדות המסומנים בכוכבית הינם חובה
            </p>

            {/* Submit */}
            <button
              type="submit"
              style={{
                background: '#4a90c4',
                opacity: formValid ? 1 : 0.5,
                cursor: formValid ? 'pointer' : 'default',
                color: '#fff',
                fontFamily: 'var(--font-body)',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.95rem' : '1.1rem',
                border: 'none',
                borderRadius: 999,
                padding: isMobile ? '9px 0' : '12px 0',
                width: '100%',
                transition: 'transform 0.2s, opacity 0.2s',
              }}
            >
              קחו אותי לפרופיל שלי &gt;&gt;
            </button>
          </form>
        </div>
      </div>

      {/* Mute — fixed bottom-right, sits ABOVE footer */}
      <button
        onClick={onMuteToggle}
        style={{
          position: 'absolute',
          bottom: 14,
          right: 14,
          opacity: 0.75,
          zIndex: 30,
          background: 'rgba(0,0,0,0.45)',
          border: 'none',
          borderRadius: '50%',
          width: isMobile ? 32 : 36,
          height: isMobile ? 32 : 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        aria-label={isMuted ? 'בטל השתקה' : 'השתקה'}
      >
        <span style={{ fontSize: isMobile ? 16 : 20 }}>{isMuted ? '🔇' : '🔊'}</span>
      </button>

    </div>
  );
}
