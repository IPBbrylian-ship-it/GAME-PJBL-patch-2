import React from 'react';
import { Heart, RotateCcw, ShieldAlert } from 'lucide-react';
import { LAYER_METAS, LayerIndex } from '../types/game';
import { RINDI_PORTRAITS } from '../game/portraits';

interface CheckpointRetryModalProps {
  layerIndex: LayerIndex;
  collectedCount: number;
  totalTargets: number;
  cluesFound: number;
  onRetry: () => void;
}

export const CheckpointRetryModal: React.FC<CheckpointRetryModalProps> = ({
  layerIndex,
  collectedCount,
  totalTargets,
  cluesFound,
  onRetry,
}) => {
  const meta = LAYER_METAS[layerIndex];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-[#04080f]/92 backdrop-blur-xs overflow-y-auto touch-pan-y horror-scroll">
      <div className="dossier-frame w-full max-w-md border border-[#d4a353]/35 overflow-hidden my-auto">
        <div className="h-[2px] w-full bg-gradient-to-r from-[#c25959] via-[#d4a353] to-[#78a9c4]" />

        <div className="p-6 sm:p-7 space-y-5 font-ui">
          <div className="flex items-start gap-4 border-b border-[#78a9c4]/14 pb-5">
            <div className="w-16 h-20 shrink-0 overflow-hidden rounded-[2px] border border-[#c25959]/45 bg-[#060c16]">
              <img
                src={RINDI_PORTRAITS.fearful}
                alt="Rindiani bertahan"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top scale-125 select-none pointer-events-none"
              />
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 font-tech text-[11px] tracking-wider text-[#c25959]">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{meta.roman} · KESEMPATAN TERAKHIR</span>
              </div>
              <h2 className="font-display text-2xl sm:text-[28px] font-semibold text-[#e8eef5] leading-tight">
                Nyawa kamu habis.
              </h2>
              <p className="text-xs sm:text-sm text-[#e8eef5]/85 leading-relaxed">
                Kamu masih punya satu kesempatan untuk mencoba lagi dari checkpoint.
              </p>
            </div>
          </div>

          <div className="border border-[#78a9c4]/16 bg-[#04080f]/65 rounded-[2px] p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#8fa1b5]">Lokasi Checkpoint</span>
              <span className="text-[#e8eef5] font-medium">{meta.title}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8fa1b5]">Progres Tersimpan</span>
              <span className="font-tech text-[#d4a353] tabular-nums">
                {collectedCount}/{totalTargets} target · {cluesFound} arsip
              </span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-[#78a9c4]/12">
              <span className="text-[#8fa1b5]">Nyawa Pemulihan</span>
              <span className="inline-flex items-center gap-1 font-tech text-[#78a9c4]">
                <Heart className="w-3.5 h-3.5 fill-current text-[#c25959]" />
                <span>5/5 (1x Cadangan Babak)</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onRetry}
            autoFocus
            className="w-full min-h-[46px] flex items-center justify-center gap-2 px-5 py-3 bg-[#d4a353] hover:bg-[#e0b467] text-[#04080f] font-semibold text-xs sm:text-sm tracking-[0.14em] rounded-[2px] cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>COBA LAGI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
