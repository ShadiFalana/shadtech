"use client";

import { useLanguage } from "@/components/providers/language-provider";

export function TechVisual({ className = "" }: { className?: string }) {
  const { t } = useLanguage();

  return (
    <svg
      viewBox="0 0 640 520"
      className={`st-visual w-full max-w-xl ${className}`}
      role="img"
      aria-label={t.public.techVisualAria}
    >
      <defs>
        <linearGradient id="stvPanel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#30343B" />
          <stop offset="100%" stopColor="#24272D" />
        </linearGradient>
        <linearGradient id="stvOrange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFB15C" />
          <stop offset="100%" stopColor="#F79432" />
        </linearGradient>
        <radialGradient id="stvGlow">
          <stop offset="0%" stopColor="#F79432" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#F79432" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="stvFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F79432" />
          <stop offset="100%" stopColor="#777F89" />
        </linearGradient>
      </defs>

      <circle cx="430" cy="210" r="210" fill="url(#stvGlow)" />

      <g className="st-visual-orbit" fill="none" stroke="#777F89" strokeOpacity="0.28">
        <circle cx="360" cy="250" r="196" strokeDasharray="4 12" />
        <circle cx="360" cy="250" r="150" strokeDasharray="2 10" strokeOpacity="0.4" />
      </g>
      <g fill="#F79432" opacity="0.8">
        <circle cx="164" cy="250" r="4" />
        <circle cx="510" cy="250" r="4" />
      </g>

      <g className="st-visual-flow" fill="none" stroke="url(#stvFade)" strokeWidth="2" strokeDasharray="7 9">
        <path d="M372 176 C410 152 418 142 448 138" />
        <path d="M300 356 C318 392 350 408 428 408" />
        <path d="M470 176 C500 210 510 276 566 258" />
      </g>

      <g className="st-visual-panel">
        <rect x="44" y="112" width="336" height="246" rx="24" fill="url(#stvPanel)" />
        <rect
          x="44.75"
          y="112.75"
          width="334.5"
          height="244.5"
          rx="23.25"
          fill="none"
          stroke="#777F89"
          strokeOpacity="0.35"
        />
        <path d="M45 150H379" stroke="#777F89" strokeOpacity="0.3" />
        <circle cx="68" cy="131" r="4" fill="#FFB15C" />
        <circle cx="82" cy="131" r="4" fill="#F79432" />
        <circle cx="96" cy="131" r="4" fill="#777F89" />

        <rect x="64" y="166" width="64" height="174" rx="14" fill="#24272D" />
        <rect x="78" y="182" width="36" height="8" rx="4" fill="#F79432" />
        <rect x="78" y="204" width="26" height="6" rx="3" fill="#777F89" />
        <rect x="78" y="222" width="34" height="6" rx="3" fill="#777F89" opacity="0.7" />
        <rect x="78" y="240" width="22" height="6" rx="3" fill="#777F89" opacity="0.5" />
        <rect x="78" y="272" width="36" height="6" rx="3" fill="#FFB15C" opacity="0.8" />
        <rect x="78" y="290" width="28" height="6" rx="3" fill="#777F89" opacity="0.6" />

        <rect x="146" y="166" width="214" height="88" rx="14" fill="#20242A" />
        <g stroke="#777F89" strokeOpacity="0.18">
          <path d="M166 188H340" />
          <path d="M166 212H340" />
          <path d="M166 236H340" />
        </g>
        <path
          className="st-visual-draw"
          d="M166 226L198 208L226 218L258 184L292 196L322 172L340 180"
          fill="none"
          stroke="#F79432"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="322" cy="172" r="5" fill="#FFB15C" />

        <rect x="146" y="266" width="100" height="74" rx="14" fill="#24272D" />
        <circle cx="168" cy="288" r="6" fill="#F79432" />
        <rect x="182" y="284" width="44" height="7" rx="3.5" fill="#777F89" />
        <rect x="162" y="310" width="68" height="6" rx="3" fill="#777F89" opacity="0.55" />
        <rect x="162" y="324" width="48" height="6" rx="3" fill="#777F89" opacity="0.35" />

        <rect x="260" y="266" width="100" height="74" rx="14" fill="#30343B" />
        <rect x="276" y="284" width="68" height="8" rx="4" fill="#FFB15C" />
        <rect x="276" y="304" width="52" height="6" rx="3" fill="#F79432" opacity="0.7" />
        <rect x="276" y="320" width="62" height="6" rx="3" fill="#777F89" opacity="0.5" />
      </g>

      <g className="st-visual-card">
        <rect x="352" y="62" width="238" height="174" rx="24" fill="#FFFFFF" />
        <rect
          x="352.75"
          y="62.75"
          width="236.5"
          height="172.5"
          rx="23.25"
          fill="none"
          stroke="#777F89"
          strokeOpacity="0.25"
        />
        <circle cx="392" cy="104" r="18" fill="#F7F8FA" />
        <path
          d="M392 90L404 95V106C404 114 399 119 392 122C385 119 380 114 380 106V95L392 90Z"
          fill="none"
          stroke="#F79432"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M386 106L390 110L399 101"
          fill="none"
          stroke="#F79432"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="424" y="92" width="104" height="9" rx="4.5" fill="#30343B" opacity="0.85" />
        <rect x="424" y="110" width="76" height="6" rx="3" fill="#777F89" opacity="0.55" />
        <rect x="376" y="144" width="190" height="1" fill="#777F89" opacity="0.2" />
        <rect x="376" y="162" width="128" height="8" rx="4" fill="#F7F8FA" />
        <rect x="376" y="180" width="96" height="8" rx="4" fill="#F7F8FA" />
        <rect x="376" y="204" width="112" height="20" rx="10" fill="url(#stvOrange)" />
      </g>

      <g className="st-visual-card st-visual-delay">
        <rect x="78" y="374" width="236" height="104" rx="22" fill="#30343B" />
        <rect x="100" y="392" width="124" height="66" rx="8" fill="#24272D" />
        <rect x="108" y="400" width="108" height="48" rx="4" fill="#F79432" opacity="0.16" />
        <path d="M92 460H232L222 468H102L92 460Z" fill="#777F89" />
        <circle cx="246" cy="402" r="5" fill="#F79432" />
        <rect x="238" y="420" width="54" height="7" rx="3.5" fill="#FFFFFF" opacity="0.65" />
        <rect x="238" y="436" width="40" height="7" rx="3.5" fill="#FFB15C" opacity="0.75" />
      </g>

      <g fill="none">
        <circle cx="430" cy="408" r="34" stroke="#F79432" strokeWidth="2" strokeOpacity="0.5" />
        <circle className="st-visual-pulse" cx="430" cy="408" r="12" fill="#F79432" />
        <circle cx="522" cy="366" r="18" fill="#30343B" stroke="#777F89" strokeOpacity="0.5" />
        <circle cx="522" cy="452" r="14" fill="#24272D" stroke="#F79432" strokeOpacity="0.6" />
        <path d="M452 396L504 372" stroke="#777F89" strokeOpacity="0.5" strokeDasharray="4 6" />
        <path d="M450 422L508 446" stroke="#777F89" strokeOpacity="0.5" strokeDasharray="4 6" />
      </g>

      <g className="st-visual-badge">
        <circle cx="574" cy="258" r="26" fill="url(#stvOrange)" />
        <path
          d="M564 258L571 265L585 250"
          fill="none"
          stroke="#20242A"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
