import React, { useState } from 'react';

interface EricHaloAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  className?: string;
  onClick?: () => void;
}

export const EricHaloAvatar: React.FC<EricHaloAvatarProps> = ({
  size = 'md',
  showStatus = true,
  className = '',
  onClick,
}) => {
  const [showModal, setShowModal] = useState(false);

  const dimensions = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32',
  }[size];

  const ringGlow = {
    sm: 'shadow-[0_0_12px_rgba(6,182,212,0.8)] border-[1.5px]',
    md: 'shadow-[0_0_18px_rgba(6,182,212,0.85)] border-2',
    lg: 'shadow-[0_0_24px_rgba(6,182,212,0.9)] border-[2.5px]',
    xl: 'shadow-[0_0_36px_rgba(6,182,212,0.95)] border-4',
  }[size];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={`relative inline-flex items-center justify-center cursor-pointer group select-none ${className}`}
        title="Eric Thomas — Private Advisor Profile"
      >
        {/* Outer neon halo ring inspired by IMG_1340 */}
        <div
          className={`relative rounded-full overflow-hidden bg-slate-950 border-cyan-400 ${dimensions} ${ringGlow} transition-all duration-300 group-hover:shadow-[0_0_28px_rgba(34,211,238,1)]`}
        >
          {/* Subtle dark wall texture & radial gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-[#060a10]" />

          {/* Inner neon circular glow behind head */}
          <div className="absolute inset-1 rounded-full border border-cyan-400/40 opacity-70" />

          {/* Stylized vector profile of Eric (bald head, trimmed beard, high turtleneck) */}
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full object-cover"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Dark background vignette */}
            <circle cx="50" cy="50" r="48" fill="#0b1118" />
            
            {/* Cyan backlight halo reflection */}
            <circle cx="50" cy="45" r="32" stroke="#22d3ee" strokeWidth="3" strokeOpacity="0.85" filter="drop-shadow(0 0 4px #06b6d4)" />
            
            {/* Silhouette of Eric Thomas (Head & Turtleneck) */}
            <g id="eric-silhouette">
              {/* Turtleneck collar and shoulders */}
              <path
                d="M 18 100 C 22 86, 32 80, 42 76 C 45 74, 55 74, 58 76 C 68 80, 78 86, 82 100 Z"
                fill="#0f172a"
              />
              <path
                d="M 38 78 C 38 71, 44 68, 50 68 C 56 68, 62 71, 62 78 Z"
                fill="#1e293b"
                stroke="#0f172a"
                strokeWidth="1"
              />

              {/* Head / profile geometry */}
              <ellipse cx="50" cy="45" rx="20" ry="24" fill="#a8795c" />
              {/* Highlight / shadow gradient on skull */}
              <ellipse cx="48" cy="42" rx="19" ry="22" fill="#8d5f43" />
              <path
                d="M 32 46 C 32 30, 41 22, 51 22 C 61 22, 69 30, 69 46 C 69 57, 61 65, 51 65 C 41 65, 32 57, 32 46 Z"
                fill="#6e462d"
              />
              {/* Ear */}
              <ellipse cx="33" cy="48" rx="4" ry="6" fill="#8d5f43" />
              
              {/* Salt and pepper beard texture */}
              <path
                d="M 36 49 C 38 60, 44 67, 51 67 C 58 67, 64 60, 66 49 C 64 52, 60 55, 51 55 C 42 55, 38 52, 36 49 Z"
                fill="#334155"
              />
              <path
                d="M 40 54 C 44 64, 48 66, 51 66 C 54 66, 58 64, 62 54 C 59 58, 55 60, 51 60 C 47 60, 43 58, 40 54 Z"
                fill="#64748b"
              />
              {/* Gray flecks in beard */}
              <path
                d="M 45 61 Q 48 64 51 64 Q 54 64 57 61"
                stroke="#cbd5e1"
                strokeWidth="1.2"
                strokeLinecap="round"
              />

              {/* Cyan rim lighting from neon ring */}
              <path
                d="M 68 34 C 70 42, 69 52, 66 58"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.9"
              />
              <path
                d="M 33 34 C 31 42, 32 52, 35 58"
                stroke="#38bdf8"
                strokeWidth="1"
                strokeLinecap="round"
                opacity="0.7"
              />
            </g>
          </svg>
        </div>

        {/* Live advisory indicator */}
        {showStatus && (
          <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500 border-2 border-[#080d14]" />
          </span>
        )}
      </div>

      {/* Profile / Advisor Dossier Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-cyan-500/30 p-6 shadow-[0_0_40px_rgba(6,182,212,0.2)] text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.7)] overflow-hidden bg-slate-950 flex-shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="48" fill="#0b1118" />
                    <circle cx="50" cy="45" r="32" stroke="#22d3ee" strokeWidth="3" strokeOpacity="0.9" />
                    <ellipse cx="50" cy="45" rx="20" ry="24" fill="#8d5f43" />
                    <path d="M 18 100 C 22 86, 32 80, 42 76 C 45 74, 55 74, 58 76 C 68 80, 78 86, 82 100 Z" fill="#0f172a" />
                    <path d="M 36 49 C 38 60, 44 67, 51 67 C 58 67, 64 60, 66 49 Z" fill="#475569" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100 font-heading">Eric Thomas</h3>
                  <p className="text-sm text-cyan-400 font-mono">Principal • ET Digital</p>
                  <p className="text-xs text-slate-400 mt-0.5">Growth Operating System (GOS) Studio</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
                  Advisor Mandate
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Engineered as a private thinking partner across marketing strategy, print-on-demand & media studios, parenting two teenagers, skepticism, and life. Bound by the Seven Non-Negotiable Rules of truth and precision.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                  <span className="text-slate-400 block">Experience:</span>
                  <span className="font-semibold text-slate-200">20+ Yrs Marketing Strategy</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                  <span className="text-slate-400 block">Ventures:</span>
                  <span className="font-semibold text-slate-200">ET Digital, Etsy POD, Doc Studio</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                  <span className="text-slate-400 block">Family:</span>
                  <span className="font-semibold text-slate-200">Father of Two Teenagers</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                  <span className="text-slate-400 block">Reasoning Style:</span>
                  <span className="font-semibold text-cyan-300">Systems + First-Principles Skeptic</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
              >
                Return to Advisory
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
