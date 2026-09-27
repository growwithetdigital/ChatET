import React from 'react';

interface EtDigitalLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light' | 'auto';
  showSubtitle?: boolean;
}

export const EtDigitalLogo: React.FC<EtDigitalLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'auto',
  showSubtitle = true,
}) => {
  const sizeMap = {
    sm: { width: 110, height: 42, fontSizeEt: 34, fontSizeSub: 7.5, subOffset: 38 },
    md: { width: 150, height: 58, fontSizeEt: 46, fontSizeSub: 10, subOffset: 52 },
    lg: { width: 220, height: 86, fontSizeEt: 68, fontSizeSub: 14.5, subOffset: 77 },
    xl: { width: 290, height: 115, fontSizeEt: 90, fontSizeSub: 19, subOffset: 102 },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const textColor = variant === 'dark' ? '#0f172a' : '#f8fafc';

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        width={currentSize.width}
        height={currentSize.height}
        viewBox="0 0 200 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="etCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>

          <filter id="etGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Circuit board traces on the left side of 'E' */}
        <g stroke="url(#etCyanGrad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#etGlow)">
          {/* Top circuit tracks */}
          <path d="M 38 18 L 22 18 L 14 12 L 6 12" />
          <path d="M 40 24 L 28 24 L 20 18 L 10 18" />
          <path d="M 42 30 L 32 30 L 25 36 L 16 36 L 8 30" />
          
          {/* Middle circuit tracks */}
          <path d="M 36 38 L 22 38 L 15 44 L 5 44" />
          <path d="M 40 44 L 29 44 L 22 50 L 12 50" />
          
          {/* Bottom circuit tracks */}
          <path d="M 42 52 L 30 52 L 24 58 L 16 58 L 8 64" />
          <path d="M 40 60 L 26 60 L 18 66 L 9 66" />
          <path d="M 38 66 L 24 66 L 16 72 L 6 72" />
        </g>

        {/* Circuit nodes (dots) */}
        <g fill="#38bdf8" filter="url(#etGlow)">
          <circle cx="6" cy="12" r="2.2" />
          <circle cx="10" cy="18" r="2.4" />
          <circle cx="8" cy="30" r="2.1" />
          <circle cx="16" cy="36" r="2.3" />
          <circle cx="5" cy="44" r="2.6" />
          <circle cx="12" cy="50" r="2.4" />
          <circle cx="8" cy="64" r="2.4" />
          <circle cx="9" cy="66" r="2.2" />
          <circle cx="6" cy="72" r="2.3" />

          {/* Floating cluster particles mimicking the branding */}
          <circle cx="12" cy="24" r="1.6" opacity="0.8" />
          <circle cx="18" cy="28" r="1.4" opacity="0.9" />
          <circle cx="10" cy="38" r="1.8" opacity="0.85" />
          <circle cx="14" cy="58" r="1.5" opacity="0.8" />
          <circle cx="4" cy="56" r="1.2" opacity="0.7" />
          <circle cx="2" cy="36" r="1.4" opacity="0.7" />
          <circle cx="3" cy="22" r="1.3" opacity="0.75" />
        </g>

        {/* ET Letterforms */}
        {/* Letter E */}
        <path
          d="M 44 14 L 92 14 L 92 24 L 58 24 L 58 35 L 86 35 L 86 45 L 58 45 L 58 56 L 94 56 L 94 66 L 44 66 Z"
          fill={textColor}
        />

        {/* Letter T */}
        <path
          d="M 104 14 L 158 14 L 158 24 L 137 24 L 137 66 L 125 66 L 125 24 L 104 24 Z"
          fill={textColor}
        />

        {/* 'DIGITAL' subtext with precise letter-spacing */}
        {showSubtitle && (
          <text
            x="100"
            y="78"
            textAnchor="middle"
            fill={textColor}
            fontSize="10.5"
            fontWeight="700"
            letterSpacing="0.48em"
            fontFamily="'Outfit', sans-serif"
          >
            DIGITAL
          </text>
        )}
      </svg>
    </div>
  );
};
