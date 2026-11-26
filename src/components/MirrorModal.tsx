import React from 'react';
import { ChevronRight } from 'lucide-react';
import { MirrorOption, MirrorQuestion } from '../types/game';

interface MirrorModalProps {
  question: MirrorQuestion;
  currentFrostLevel: number;
  onSelect: (option: MirrorOption) => void;
}

export const MirrorModal: React.FC<MirrorModalProps> = ({
  question,
  currentFrostLevel,
  onSelect,
}) => {
  const frostPct = Math.round(currentFrostLevel * 100);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-[#04080f]/92 overflow-y-auto touch-pan-y horror-scroll">
      <div className="dossier-frame w-full max-w-xl border border-[#78a9c4]/20 backdrop-blur-sm p-6 sm:p-8 my-auto space-y-5">
        {/* Quiet Metadata Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#78a9c4]/14 pb-3">
          <span className="font-ui text-xs text-[#8fa1b5]">{question.betweenLabel}</span>
          <span className="font-tech text-xs tabular-nums text-[#78a9c4]">
            BEKU {frostPct}%
          </span>
        </div>

        {/* Single Focused Heading + Prompt */}
        <div className="space-y-3">
          <h2 className="font-display text-2xl sm:text-[28px] font-semibold text-[#e8eef5] leading-tight">
            Cermin Psikologis
          </h2>
          <p className="font-ui text-sm sm:text-[15px] text-[#e8eef5] leading-[1.65]">
            {question.prompt}
          </p>
          <p className="font-ui text-xs text-[#d4a353] pt-1 border-t border-[#78a9c4]/12">
            {question.contextNote}
          </p>
        </div>

        {/* Clean Tactile Options */}
        <div className="space-y-2.5 pt-1">
          {question.options.map((opt, idx) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt)}
              className="w-full min-h-[52px] text-left p-3.5 sm:p-4 border border-[#78a9c4]/18 bg-[#04080f]/75 hover:bg-[#0a121e] hover:border-[#d4a353]/80 rounded-[2px] transition-colors duration-150 cursor-pointer group flex items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="font-ui text-sm font-semibold text-[#e8eef5] group-hover:text-[#d4a353] transition-colors">
                  <span className="font-tech text-xs text-[#8fa1b5] mr-2">{idx + 1}.</span>
                  {opt.label}
                </div>
                <p className="font-ui text-xs text-[#8fa1b5] leading-relaxed">{opt.sublabel}</p>
              </div>
              <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-[#8fa1b5]/50 group-hover:text-[#d4a353] transition-colors" />
            </button>
          ))}
        </div>

        <p className="font-ui text-[11px] text-[#8fa1b5]/75 pt-1">
          Pilihan Anda memengaruhi ketebalan kabut, intensitas ancaman, dan kondisi akhir Kubah Kaca.
        </p>
      </div>
    </div>
  );
};
