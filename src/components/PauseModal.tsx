import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Monitor, Smartphone, Film } from 'lucide-react';
import { ControlMode, LAYER_METAS, LayerIndex } from '../types/game';

interface PauseModalProps {
  layerIndex: LayerIndex;
  controlMode: ControlMode;
  muted: boolean;
  cinematicEffects: boolean;
  onResume: () => void;
  onToggleControlMode: () => void;
  onToggleMute: () => void;
  onToggleCinematicEffects: () => void;
  onRestart: () => void;
  onReturnToTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  layerIndex,
  controlMode,
  muted,
  cinematicEffects,
  onResume,
  onToggleControlMode,
  onToggleMute,
  onToggleCinematicEffects,
  onRestart,
  onReturnToTitle,
}) => {
  const meta = LAYER_METAS[layerIndex];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#04080f]/86 backdrop-blur-xs overflow-y-auto touch-pan-y horror-scroll">
      <div className="dossier-frame w-full max-w-sm border border-[#78a9c4]/20 p-6 sm:p-7 space-y-5 my-auto">
        <div className="space-y-1 border-b border-[#78a9c4]/14 pb-4">
          <div className="font-tech text-[11px] tracking-wider text-[#8fa1b5]">
            {meta.roman} · DIJEDA
          </div>
          <h2 className="font-display text-2xl sm:text-[28px] font-semibold text-[#e8eef5] leading-tight">
            {meta.title}
          </h2>
        </div>

        {/* Compact Control Reference */}
        <div className="divide-y divide-[#78a9c4]/10 border-b border-[#78a9c4]/14 pb-3 text-xs font-ui">
          {controlMode === 'mobile' ? (
            <>
              <div className="flex justify-between py-1.5">
                <span className="font-tech text-[#78a9c4]">Analog Kiri</span>
                <span className="text-[#8fa1b5]">Bergerak (&gt;85% Lari)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-tech text-[#78a9c4]">Geser Kanan</span>
                <span className="text-[#8fa1b5]">Arah pandang</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-tech text-[#d4a353]">Lentera / Aksi</span>
                <span className="text-[#8fa1b5]">Bekukan / Interaksi</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between py-1.5">
                <span className="font-tech text-[#78a9c4]">WASD / Shift</span>
                <span className="text-[#8fa1b5]">Bergerak / Berlari</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-tech text-[#d4a353]">F / E</span>
                <span className="text-[#8fa1b5]">Lentera / Interaksi</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-tech text-[#8fa1b5]">Mouse</span>
                <span className="text-[#8fa1b5]">Arah pandang &amp; senter</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2.5 font-ui">
          <button
            type="button"
            onClick={onResume}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 bg-[#d4a353] hover:bg-[#e0b467] text-[#04080f] font-semibold text-xs tracking-wider rounded-[2px] cursor-pointer transition-colors whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5" />
            <span>LANJUTKAN</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onToggleControlMode}
              className="min-h-[44px] flex items-center justify-center gap-1.5 py-2 px-2.5 border border-[#78a9c4]/20 bg-[#04080f]/75 hover:border-[#d4a353]/70 text-[#e8eef5] text-xs rounded-[2px] cursor-pointer transition-colors whitespace-nowrap"
            >
              {controlMode === 'mobile' ? (
                <Smartphone className="w-3.5 h-3.5 text-[#78a9c4]" />
              ) : (
                <Monitor className="w-3.5 h-3.5 text-[#d4a353]" />
              )}
              <span>{controlMode === 'mobile' ? 'Mobile' : 'PC'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              className="min-h-[44px] flex items-center justify-center gap-1.5 py-2 px-2.5 border border-[#78a9c4]/20 bg-[#04080f]/75 hover:border-[#d4a353]/70 text-[#e8eef5] text-xs rounded-[2px] cursor-pointer transition-colors whitespace-nowrap"
            >
              {muted ? (
                <VolumeX className="w-3.5 h-3.5 text-[#c25959]" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#78a9c4]" />
              )}
              <span>{muted ? 'Suara Mati' : 'Suara Aktif'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleCinematicEffects}
            className="w-full min-h-[42px] flex items-center justify-center gap-2 py-2 px-3 border border-[#78a9c4]/18 bg-[#04080f]/70 hover:border-[#d4a353]/65 text-xs rounded-[2px] cursor-pointer transition-colors whitespace-nowrap"
          >
            <Film className={`w-3.5 h-3.5 ${cinematicEffects ? 'text-[#d4a353]' : 'text-[#8fa1b5]'}`} />
            <span className="text-[#8fa1b5]">Efek Kamera Sinematik:</span>
            <span className={cinematicEffects ? 'text-[#e8eef5] font-medium' : 'text-[#8fa1b5]'}>
              {cinematicEffects ? 'Aktif' : 'Minimal'}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onRestart}
              className="min-h-[44px] flex items-center justify-center gap-1.5 py-2 border border-[#78a9c4]/15 bg-[#04080f]/60 hover:border-[#d4a353]/70 text-[#8fa1b5] hover:text-[#e8eef5] text-xs rounded-[2px] cursor-pointer transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ulangi Awal</span>
            </button>
            <button
              type="button"
              onClick={onReturnToTitle}
              className="min-h-[44px] flex items-center justify-center gap-1.5 py-2 border border-[#78a9c4]/15 bg-[#04080f]/60 hover:border-[#78a9c4]/70 text-[#8fa1b5] hover:text-[#e8eef5] text-xs rounded-[2px] cursor-pointer transition-colors whitespace-nowrap"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Layar Judul</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
