import React from 'react';
import { Compass, TrendingUp, Boxes, Users, Cpu, HeartHandshake } from 'lucide-react';
import { FOCUS_AREAS } from '../data/constants';
import { FocusAreaId } from '../types';

interface FocusLensSelectorProps {
  selectedLens: FocusAreaId;
  onSelectLens: (lens: FocusAreaId) => void;
  className?: string;
}

export const FocusLensSelector: React.FC<FocusLensSelectorProps> = ({
  selectedLens,
  onSelectLens,
  className = '',
}) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Compass':
        return <Compass className="w-3.5 h-3.5" />;
      case 'TrendingUp':
        return <TrendingUp className="w-3.5 h-3.5" />;
      case 'Boxes':
        return <Boxes className="w-3.5 h-3.5" />;
      case 'Users':
        return <Users className="w-3.5 h-3.5" />;
      case 'Cpu':
        return <Cpu className="w-3.5 h-3.5" />;
      case 'HeartHandshake':
        return <HeartHandshake className="w-3.5 h-3.5" />;
      default:
        return <Compass className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar ${className}`}>
      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider pl-1 pr-1 flex-shrink-0">
        Thinking Lens:
      </span>

      {FOCUS_AREAS.map((area) => {
        const isSelected = selectedLens === area.id;

        return (
          <button
            key={area.id}
            onClick={() => onSelectLens(area.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              isSelected
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
            }`}
            title={area.description}
          >
            <span className={isSelected ? 'text-cyan-300' : 'text-slate-400'}>
              {getIcon(area.iconName)}
            </span>
            <span>{area.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
};
