import React, { useEffect } from 'react';
import { BookOpen, Camera, FileText, KeyRound, Package, X } from 'lucide-react';
import { ControlMode, LoreCategory } from '../types/game';
import { LORE_CLUES } from '../game/lore';

interface InspectModalProps {
  loreId: string;
  controlMode: ControlMode;
  onClose: () => void;
}

function getCategoryMeta(cat: LoreCategory): { label: string; Icon: React.FC<{ className?: string }> } {
  if (cat === 'foto') return { label: 'FOTO ARSIP', Icon: Camera };
  if (cat === 'papan') return { label: 'PAPAN INFORMASI', Icon: BookOpen };
  if (cat === 'benda') return { label: 'BENDA PRIBADI', Icon: Package };
  return { label: 'DOKUMEN & CATATAN', Icon: FileText };
}

export const InspectModal: React.FC<InspectModalProps> = ({
  loreId,
  controlMode,
  onClose,
}) => {
  const clue = LORE_CLUES[loreId];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!clue) return null;

  const { label, Icon } = getCategoryMeta(clue.category);
  const accent = clue.accentColor ?? '#d4a353';

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-[#04080f]/86 backdrop-blur-xs overflow-y-auto touch-pan-y">
      <div className="dossier-frame w-full max-w-xl border border-[#78a9c4]/25 my-auto overflow-hidden">
        <div className="h-[2px] w-full" style={{ backgroundColor: accent }} />

        <div className="p-6 sm:p-7 space-y-5 font-ui">
          <div className="flex items-start justify-between gap-4 border-b border-[#78a9c4]/14 pb-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 font-tech text-[11px] tracking-wider">
                <span className="inline-flex items-center gap-1.5" style={{ color: accent }}>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </span>
                <span className="text-[#8fa1b5]/40">·</span>
                <span className="text-[#8fa1b5]">{clue.dateOrTag}</span>
              </div>

              <h2 className="font-display text-2xl sm:text-[26px] font-semibold text-[#e8eef5] leading-snug">
                {clue.title}
              </h2>

              <div className="text-xs text-[#78a9c4]">{clue.locationLabel}</div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup dokumen"
              className="p-2 border border-[#78a9c4]/20 bg-[#04080f]/75 hover:border-[#d4a353] text-[#8fa1b5] hover:text-[#e8eef5] rounded-[2px] cursor-pointer transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="border-l-2 pl-4 py-1 space-y-3" style={{ borderColor: accent }}>
            <p className="font-ui text-sm sm:text-[15px] text-[#e8eef5] leading-[1.7] whitespace-pre-line">
              {clue.excerpt}
            </p>
          </div>

          <div className="bg-[#04080f]/70 border border-[#78a9c4]/14 px-4 py-3 rounded-[2px]">
            <div className="font-tech text-[10px] tracking-wider text-[#8fa1b5] mb-1">
              CATATAN PEMAHAMAN BATIN
            </div>
            <p className="text-xs sm:text-[13px] text-[#8fa1b5] leading-relaxed">
              {clue.contextNote}
            </p>
          </div>

          {clue.clueHint && (
            <div className="border border-[#d4a353]/35 bg-[#d4a353]/8 px-4 py-3 rounded-[2px] flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-[#d4a353] shrink-0 mt-0.5" />
              <div>
                <div className="font-tech text-[10px] tracking-wider text-[#d4a353]">
                  PETUNJUK TEKA-TEKI TERSIMPAN DI ARSIP
                </div>
                <div className="text-xs text-[#e8eef5] mt-0.5 leading-relaxed">
                  {clue.clueHint}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="font-tech text-[11px] text-[#8fa1b5]">
              {controlMode === 'mobile'
                ? 'Tersimpan otomatis ke Arsip Petunjuk'
                : 'Tekan [J] kapan saja untuk membuka Arsip'}
            </span>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] px-5 py-2 bg-[#d4a353] hover:bg-[#e0b467] text-[#04080f] font-semibold text-xs tracking-wider rounded-[2px] cursor-pointer transition-colors"
            >
              {controlMode === 'mobile' ? 'Simpan & Lanjutkan' : 'Tutup [Spasi / Esc]'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
