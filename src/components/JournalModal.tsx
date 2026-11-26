import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, Lock, X } from 'lucide-react';
import { ControlMode, LAYER_METAS, LayerIndex } from '../types/game';
import { LORE_CLUES, PUZZLE_CONFIGS } from '../game/lore';

interface JournalModalProps {
  currentLayer: LayerIndex;
  controlMode: ControlMode;
  discoveredClues: string[];
  solvedPuzzles: string[];
  onClose: () => void;
}

export const JournalModal: React.FC<JournalModalProps> = ({
  currentLayer,
  controlMode,
  discoveredClues,
  solvedPuzzles,
  onClose,
}) => {
  const [selectedLayer, setSelectedLayer] = useState<LayerIndex>(currentLayer);

  useEffect(() => {
    setSelectedLayer(currentLayer);
  }, [currentLayer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyJ') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const layerClues = Object.values(LORE_CLUES).filter((c) => c.layerIndex === selectedLayer);
  const layerPuzzles = Object.values(PUZZLE_CONFIGS).filter((p) => p.layerIndex === selectedLayer);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-[#04080f]/90 backdrop-blur-xs overflow-y-auto touch-pan-y horror-scroll">
      <div className="dossier-frame w-full max-w-2xl border border-[#78a9c4]/24 my-auto overflow-hidden">
        <div className="h-[2px] w-full bg-[#78a9c4]" />

        <div className="p-6 sm:p-7 space-y-5 font-ui">
          <div className="flex items-start justify-between gap-4 border-b border-[#78a9c4]/14 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 font-tech text-[11px] tracking-wider text-[#78a9c4]">
                <BookOpen className="w-3.5 h-3.5" />
                <span>ARSIP PETUNJUK &amp; CATATAN MEMORI</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#e8eef5] mt-1">
                Berkas Jejak Rindiani ({discoveredClues.length}/{Object.keys(LORE_CLUES).length})
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup Arsip"
              className="p-2 border border-[#78a9c4]/20 bg-[#04080f]/75 hover:border-[#d4a353] text-[#8fa1b5] hover:text-[#e8eef5] rounded-[2px] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Layer Tabs */}
          <div className="grid grid-cols-4 gap-1.5">
            {LAYER_METAS.map((meta) => {
              const active = selectedLayer === meta.index;
              return (
                <button
                  key={meta.index}
                  type="button"
                  onClick={() => setSelectedLayer(meta.index)}
                  className={`py-2 px-2 border rounded-[2px] font-tech text-[11px] cursor-pointer transition-colors ${
                    active
                      ? 'border-[#d4a353] bg-[#d4a353]/14 text-[#d4a353]'
                      : 'border-[#78a9c4]/18 bg-[#04080f]/60 text-[#8fa1b5] hover:text-[#e8eef5]'
                  }`}
                >
                  {meta.roman}
                </button>
              );
            })}
          </div>

          {/* Puzzle Status Strip for Selected Layer */}
          {layerPuzzles.map((pz) => {
            const done = solvedPuzzles.includes(pz.id);
            return (
              <div
                key={pz.id}
                className={`px-3.5 py-2.5 border rounded-[2px] flex items-center justify-between gap-3 ${
                  done
                    ? 'border-[#d4a353]/40 bg-[#d4a353]/10'
                    : 'border-[#78a9c4]/20 bg-[#04080f]/65'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-[#e8eef5]">{pz.title}</div>
                  <div className="text-[11px] text-[#8fa1b5]">{pz.unlockTargetLabel}</div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 font-tech text-[11px] shrink-0 ${
                    done ? 'text-[#d4a353]' : 'text-[#8fa1b5]'
                  }`}
                >
                  {done ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>SELESAI</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>TERKUNCI</span>
                    </>
                  )}
                </span>
              </div>
            );
          })}

          {/* Clue Cards */}
          <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1 horror-scroll">
            {layerClues.map((clue) => {
              const found = discoveredClues.includes(clue.id);
              if (!found) {
                return (
                  <div
                    key={clue.id}
                    className="border border-[#78a9c4]/14 bg-[#04080f]/45 px-4 py-3 rounded-[2px] flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-medium text-[#8fa1b5]">Petunjuk Belum Ditemukan</div>
                      <div className="font-tech text-[11px] text-[#8fa1b5]/65 mt-0.5">
                        Lokasi: {clue.locationLabel}
                      </div>
                    </div>
                    <Lock className="w-3.5 h-3.5 text-[#8fa1b5]/55 shrink-0" />
                  </div>
                );
              }

              return (
                <div
                  key={clue.id}
                  className="border border-[#78a9c4]/22 bg-[#04080f]/75 px-4 py-3.5 rounded-[2px] space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-[#e8eef5]">{clue.title}</div>
                    <span className="font-tech text-[10px] text-[#78a9c4]">{clue.locationLabel}</span>
                  </div>
                  <p className="text-xs text-[#e8eef5]/85 leading-relaxed">{clue.excerpt}</p>
                  {clue.clueHint && (
                    <div className="font-tech text-[11px] text-[#d4a353] bg-[#d4a353]/10 px-2.5 py-1.5 rounded-[2px]">
                      {clue.clueHint}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-5 py-2 bg-[#d4a353] hover:bg-[#e0b467] text-[#04080f] font-semibold text-xs tracking-wider rounded-[2px] cursor-pointer"
            >
              {controlMode === 'mobile' ? 'Tutup Arsip' : 'Tutup [J / Esc]'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
