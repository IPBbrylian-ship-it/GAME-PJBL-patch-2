import React, { useState } from 'react';
import { Volume2, VolumeX, Download, Monitor, Smartphone, X } from 'lucide-react';
import { ControlMode, DifficultyMode } from '../types/game';

interface TitleScreenProps {
  muted: boolean;
  difficulty: DifficultyMode;
  controlMode: ControlMode;
  cinematicEffects: boolean;
  respondentName: string;
  onChangeDifficulty: (mode: DifficultyMode) => void;
  onChangeControlMode: (mode: ControlMode) => void;
  onToggleCinematicEffects: () => void;
  onChangeRespondentName: (name: string) => void;
  onToggleMute: () => void;
  onStart: () => void;
  onDownloadStandalone: () => void;
}

type ActivePanel = 'none' | 'settings' | 'controls' | 'about';

export const TitleScreen: React.FC<TitleScreenProps> = ({
  muted,
  difficulty,
  controlMode,
  cinematicEffects,
  respondentName,
  onChangeDifficulty,
  onChangeControlMode,
  onToggleCinematicEffects,
  onChangeRespondentName,
  onToggleMute,
  onStart,
  onDownloadStandalone,
}) => {
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-6 sm:p-10 md:p-14 overflow-y-auto touch-pan-y bg-gradient-to-r from-[#04080f]/84 via-[#04080f]/38 to-transparent">
      {/* Minimal Top Utility Bar (Audio Toggle Only) */}
      <div className="flex items-center justify-end shrink-0">
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Aktifkan Suara' : 'Bisukan Suara'}
          className="min-h-[44px] inline-flex items-center gap-2 px-3 py-2 text-xs font-ui tracking-wider text-[#8fa1b5] hover:text-[#e8eef5] transition-colors cursor-pointer whitespace-nowrap"
        >
          {muted ? (
            <VolumeX className="w-4 h-4 text-[#c25959]" />
          ) : (
            <Volume2 className="w-4 h-4 text-[#78a9c4]" />
          )}
          <span>{muted ? 'Suara Mati' : 'Suara Aktif'}</span>
        </button>
      </div>

      {/* Main Minimalist Cinematic Title & Primary Navigation */}
      <div className="my-auto py-6 max-w-xl">
        <h1 className="font-display font-semibold text-4xl sm:text-6xl lg:text-[68px] leading-[0.94] tracking-[0.02em] text-[#e8eef5]">
          SHATTERED
          <span className="block">MEMORIES</span>
        </h1>
        <p className="font-display text-lg sm:text-xl lg:text-2xl tracking-[0.16em] text-[#d4a353] font-medium mt-3">
          SUDUT BEKU RINDIANI
        </p>

        {/* Primary Vertical Navigation */}
        <nav aria-label="Menu Utama" className="mt-8 sm:mt-10 flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={onStart}
            className="min-h-[46px] px-7 py-2.5 bg-[#d4a353] hover:bg-[#e0b467] text-[#04080f] font-ui font-semibold text-xs sm:text-sm tracking-[0.16em] rounded-[2px] transition-colors cursor-pointer whitespace-nowrap"
          >
            MULAI PERMAINAN
          </button>

          <div className="mt-3 flex flex-col items-start gap-0.5 font-ui text-xs sm:text-sm tracking-[0.14em]">
            <button
              type="button"
              onClick={() => setActivePanel('settings')}
              className="min-h-[40px] py-2 text-[#8fa1b5] hover:text-[#e8eef5] transition-colors cursor-pointer whitespace-nowrap"
            >
              PENGATURAN
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('controls')}
              className="min-h-[40px] py-2 text-[#8fa1b5] hover:text-[#e8eef5] transition-colors cursor-pointer whitespace-nowrap"
            >
              KONTROL
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('about')}
              className="min-h-[40px] py-2 text-[#8fa1b5] hover:text-[#e8eef5] transition-colors cursor-pointer whitespace-nowrap"
            >
              TENTANG
            </button>
          </div>
        </nav>
      </div>

      {/* Bottom Breathing Room */}
      <div className="h-4 shrink-0" aria-hidden="true" />

      {/* Focused Sub-Panel Overlay (Pengaturan / Kontrol / Tentang) */}
      {activePanel !== 'none' && (
        <div
          onClick={() => setActivePanel('none')}
          className="fixed inset-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-[#04080f]/80 backdrop-blur-xs overflow-y-auto touch-pan-y"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="dossier-frame w-full max-w-md border border-[#78a9c4]/20 p-6 sm:p-7 space-y-6 my-auto"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between gap-4 border-b border-[#78a9c4]/15 pb-4">
              <h2 className="font-display text-2xl sm:text-[28px] font-semibold text-[#e8eef5] leading-none">
                {activePanel === 'settings' && 'Pengaturan'}
                {activePanel === 'controls' && 'Kontrol'}
                {activePanel === 'about' && 'Tentang'}
              </h2>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                aria-label="Tutup panel"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#8fa1b5] hover:text-[#e8eef5] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Settings Content */}
            {activePanel === 'settings' && (
              <div className="space-y-5 font-ui">
                <div className="space-y-2">
                  <label htmlFor="respName" className="block text-xs text-[#8fa1b5]">
                    Inisial / Nama Responden (Opsional)
                  </label>
                  <input
                    id="respName"
                    type="text"
                    value={respondentName}
                    onChange={(e) => onChangeRespondentName(e.target.value)}
                    placeholder="Misal: Mahasiswa A / NIM"
                    className="w-full min-h-[44px] px-3 py-2 border border-[#78a9c4]/25 bg-[#04080f]/80 rounded-[2px] text-sm text-[#e8eef5] placeholder:text-[#64748b] focus:outline-none focus:border-[#d4a353]"
                  />
                </div>

                <div className="space-y-2">
                  <span className="block text-xs text-[#8fa1b5]">Intensitas Eksplorasi</span>
                  <div className="grid grid-cols-2 border border-[#78a9c4]/20 bg-[#04080f]/75 rounded-[2px]">
                    <button
                      type="button"
                      onClick={() => onChangeDifficulty('standard')}
                      className={`min-h-[44px] py-2 text-xs font-medium cursor-pointer transition-colors ${
                        difficulty === 'standard'
                          ? 'bg-[#121c2b] text-[#d4a353]'
                          : 'text-[#8fa1b5] hover:text-[#e8eef5]'
                      }`}
                    >
                      Standar
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeDifficulty('story')}
                      className={`min-h-[44px] py-2 text-xs font-medium cursor-pointer transition-colors ${
                        difficulty === 'story'
                          ? 'bg-[#121c2b] text-[#78a9c4]'
                          : 'text-[#8fa1b5] hover:text-[#e8eef5]'
                      }`}
                    >
                      Cerita Aman
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#78a9c4]/15">
                  <span className="text-xs text-[#8fa1b5]">Audio Permainan</span>
                  <button
                    type="button"
                    onClick={onToggleMute}
                    className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 border border-[#78a9c4]/25 bg-[#04080f]/75 hover:border-[#d4a353]/60 rounded-[2px] text-xs text-[#e8eef5] cursor-pointer transition-colors"
                  >
                    {muted ? (
                      <VolumeX className="w-3.5 h-3.5 text-[#c25959]" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-[#78a9c4]" />
                    )}
                    <span>{muted ? 'Suara Mati' : 'Suara Aktif'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#78a9c4]/15">
                  <span className="text-xs text-[#8fa1b5]">Efek Kamera Sinematik</span>
                  <button
                    type="button"
                    onClick={onToggleCinematicEffects}
                    className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 border border-[#78a9c4]/25 bg-[#04080f]/75 hover:border-[#d4a353]/60 rounded-[2px] text-xs text-[#e8eef5] cursor-pointer transition-colors"
                  >
                    <span className={cinematicEffects ? 'text-[#d4a353]' : 'text-[#8fa1b5]'}>
                      {cinematicEffects ? 'Aktif' : 'Minimal'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Controls Content */}
            {activePanel === 'controls' && (
              <div className="space-y-5 font-ui">
                <div className="space-y-2">
                  <span className="block text-xs text-[#8fa1b5]">Mode Perangkat</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => onChangeControlMode('pc')}
                      className={`min-h-[44px] px-3 py-2 border rounded-[2px] flex items-center justify-center gap-2 text-xs font-medium transition-colors cursor-pointer ${
                        controlMode === 'pc'
                          ? 'border-[#d4a353] bg-[#121c2b] text-[#e8eef5]'
                          : 'border-[#78a9c4]/20 bg-[#04080f]/75 text-[#8fa1b5] hover:text-[#e8eef5]'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5 text-[#d4a353]" />
                      <span>PC / Laptop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeControlMode('mobile')}
                      className={`min-h-[44px] px-3 py-2 border rounded-[2px] flex items-center justify-center gap-2 text-xs font-medium transition-colors cursor-pointer ${
                        controlMode === 'mobile'
                          ? 'border-[#d4a353] bg-[#121c2b] text-[#e8eef5]'
                          : 'border-[#78a9c4]/20 bg-[#04080f]/75 text-[#8fa1b5] hover:text-[#e8eef5]'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5 text-[#78a9c4]" />
                      <span>Mobile / Sentuh</span>
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-[#78a9c4]/12 border-t border-b border-[#78a9c4]/15 text-xs">
                  {controlMode === 'mobile' ? (
                    <>
                      <div className="flex justify-between gap-4 py-2.5">
                        <span className="font-tech text-[#78a9c4]">Analog Kiri</span>
                        <span className="text-[#e8eef5] text-right">Bergerak (&gt;85% lari)</span>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <span className="font-tech text-[#78a9c4]">Geser Kanan</span>
                        <span className="text-[#e8eef5] text-right">Arah pandang &amp; senter</span>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <span className="font-tech text-[#d4a353]">Lentera</span>
                        <span className="text-[#e8eef5] text-right">Bekukan bayangan</span>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <span className="font-tech text-[#d4a353]">Aksi</span>
                        <span className="text-[#e8eef5] text-right">Ambil / Sembunyi / Segel</span>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <span className="font-tech text-[#8fa1b5]">Lari</span>
                        <span className="text-[#e8eef5] text-right">Aktif/nonaktif berlari</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between gap-4 py-2.5">
                        <span className="font-tech text-[#78a9c4]">WASD / Panah</span>
                        <span className="text-[#e8eef5] text-right">Bergerak</span>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <span className="font-tech text-[#78a9c4]">Mouse</span>
                        <span className="text-[#e8eef5] text-right">Arah pandang &amp; senter</span>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <span className="font-tech text-[#8fa1b5]">Shift</span>
                        <span className="text-[#e8eef5] text-right">Berlari cepat</span>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <span className="font-tech text-[#d4a353]">F</span>
                        <span className="text-[#e8eef5] text-right">Lentera pembeku</span>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <span className="font-tech text-[#d4a353]">E</span>
                        <span className="text-[#e8eef5] text-right">Ambil / Sembunyi / Segel</span>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <span className="font-tech text-[#8fa1b5]">Esc</span>
                        <span className="text-[#e8eef5] text-right">Jeda permainan</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* About Content */}
            {activePanel === 'about' && (
              <div className="space-y-4 font-ui text-sm text-[#e8eef5]/90 leading-relaxed">
                <p>
                  Di sudut taman kampus yang membeku, Bima mencoba menembus tembok diam Rindiani dan menyelamatkan
                  ingatan yang terkunci dari trauma yang terlalu lama dinormalisasi.
                </p>
                <p className="text-xs text-[#8fa1b5] leading-relaxed">
                  Karya ini merupakan media riset PjBL Kewarganegaraan untuk menganalisis kesadaran terhadap budaya
                  pembiaran kekerasan seksual (<em>rape culture</em>). Seluruh refleksi nilai Pancasila dan UUD NRI
                  1945 dirangkum pada akhir penelusuran.
                </p>
                <div className="pt-2 border-t border-[#78a9c4]/15">
                  <button
                    type="button"
                    onClick={onDownloadStandalone}
                    className="min-h-[44px] inline-flex items-center gap-2 text-xs text-[#78a9c4] hover:text-[#e8eef5] transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Versi 1-File HTML (Offline)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Panel Footer */}
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="min-h-[44px] px-5 py-2 border border-[#78a9c4]/25 bg-[#04080f]/80 hover:border-[#d4a353] text-xs font-ui font-medium tracking-wider text-[#e8eef5] rounded-[2px] transition-colors cursor-pointer"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
