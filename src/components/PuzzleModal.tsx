import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  Delete,
  HelpCircle,
  KeyRound,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';
import { ControlMode } from '../types/game';
import { LORE_CLUES, PUZZLE_CONFIGS } from '../game/lore';

interface PuzzleModalProps {
  puzzleId: string;
  controlMode: ControlMode;
  discoveredClues: string[];
  onSwitchClick?: (pitchOffset?: number) => void;
  onSolve: (puzzleId: string) => void;
  onCancel: () => void;
}

const SATGAS_STEPS = [
  { id: 'DENGAR', label: '1. Dengar', desc: 'Ruang aman bercerita tanpa dihakimi' },
  { id: 'LINDUNGI', label: '2. Lindungi', desc: 'Jamin keamanan & kerahasiaan korban' },
  { id: 'TINDAK', label: '3. Tindak', desc: 'Tegakkan sanksi tanpa pandang jabatan' },
  { id: 'PULIHKAN', label: '4. Pulihkan', desc: 'Pendampingan psikologis & martabat' },
];

export const PuzzleModal: React.FC<PuzzleModalProps> = ({
  puzzleId,
  controlMode,
  discoveredClues,
  onSwitchClick,
  onSolve,
  onCancel,
}) => {
  const config = PUZZLE_CONFIGS[puzzleId];
  const [switches, setSwitches] = useState<[boolean, boolean, boolean, boolean]>([
    false,
    false,
    false,
    false,
  ]);
  const [digits, setDigits] = useState<string>('');
  const [dials, setDials] = useState<[number, number, number]>([0, 0, 0]);
  const [satgasOrder, setSatgasOrder] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setSwitches([false, false, false, false]);
    setDigits('');
    setDials([0, 0, 0]);
    setSatgasOrder([]);
    setErrorMsg(null);
    setShowHint(false);
  }, [puzzleId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (config?.kind === 'keypad') {
        if (/^Digit[0-9]$/.test(e.code) || /^Numpad[0-9]$/.test(e.code)) {
          const val = e.code.slice(-1);
          setDigits((prev) => (prev.length < 3 ? prev + val : prev));
          setErrorMsg(null);
          onSwitchClick?.(1);
        } else if (e.code === 'Backspace') {
          setDigits((prev) => prev.slice(0, -1));
          setErrorMsg(null);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [config?.kind, onCancel, onSwitchClick]);

  if (!config) return null;

  const relatedClue = LORE_CLUES[config.relatedClueId];
  const hasFoundClue = discoveredClues.includes(config.relatedClueId);

  const handleToggleSwitch = (idx: number) => {
    onSwitchClick?.(switches[idx] ? -1 : 1);
    setErrorMsg(null);
    setSwitches((prev) => {
      const next: [boolean, boolean, boolean, boolean] = [...prev] as [
        boolean,
        boolean,
        boolean,
        boolean,
      ];
      next[idx] = !next[idx];
      return next;
    });
  };

  const handleVerifyFusebox = () => {
    const code = switches.map((on) => (on ? '1' : '0')).join('');
    if (code === config.solutionCode) {
      onSolve(puzzleId);
    } else {
      onSwitchClick?.(-3);
      setErrorMsg('Susunan sekring belum sesuai jalur aman. Periksa catatan listrik pada kalender.');
    }
  };

  const handleKeypadPress = (num: string) => {
    onSwitchClick?.(1);
    setErrorMsg(null);
    setDigits((prev) => (prev.length < 3 ? prev + num : prev));
  };

  const handleVerifyKeypad = () => {
    if (digits === config.solutionCode) {
      onSolve(puzzleId);
    } else {
      onSwitchClick?.(-3);
      setErrorMsg('Kode kombinasi salah. Coba periksa log loker penjaga sekolah.');
      setDigits('');
    }
  };

  const handleDialStep = (idx: number, delta: number) => {
    onSwitchClick?.(delta);
    setErrorMsg(null);
    setDials((prev) => {
      const next: [number, number, number] = [...prev] as [number, number, number];
      next[idx] = (next[idx] + delta + 10) % 10;
      return next;
    });
  };

  const handleVerifyTerminal = () => {
    const code = dials.join('');
    if (code === config.solutionCode) {
      onSolve(puzzleId);
    } else {
      onSwitchClick?.(-3);
      setErrorMsg('Tanda waktu sinkronisasi tidak cocok dengan log pesan malam.');
    }
  };

  const handleSelectSatgasStep = (stepId: string) => {
    if (satgasOrder.includes(stepId)) return;
    onSwitchClick?.(satgasOrder.length);
    setErrorMsg(null);
    const next = [...satgasOrder, stepId];
    setSatgasOrder(next);
    if (next.length === 4) {
      const joined = next.join('-');
      if (joined === config.solutionCode) {
        onSolve(puzzleId);
      } else {
        onSwitchClick?.(-3);
        setErrorMsg('Urutan protokol belum tepat. Ikuti alur 1 → 2 → 3 → 4 pada papan Satgas PPKS.');
        window.setTimeout(() => setSatgasOrder([]), 550);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-[#04080f]/88 backdrop-blur-xs overflow-y-auto touch-pan-y">
      <div className="dossier-frame w-full max-w-xl border border-[#78a9c4]/25 my-auto overflow-hidden">
        <div className="h-[2px] w-full bg-[#d4a353]" />

        <div className="p-6 sm:p-7 space-y-5 font-ui">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-[#78a9c4]/14 pb-4">
            <div className="space-y-1">
              <div className="font-tech text-[11px] tracking-wider text-[#d4a353] flex items-center gap-1.5">
                {config.kind === 'fusebox' && <Zap className="w-3.5 h-3.5" />}
                {config.kind === 'keypad' && <KeyRound className="w-3.5 h-3.5" />}
                {config.kind === 'terminal' && <Cpu className="w-3.5 h-3.5" />}
                {config.kind === 'satgas' && <ShieldCheck className="w-3.5 h-3.5" />}
                <span>{config.subtitle}</span>
              </div>
              <h2 className="font-display text-2xl sm:text-[26px] font-semibold text-[#e8eef5]">
                {config.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onCancel}
              aria-label="Tutup panel teka-teki"
              className="p-2 border border-[#78a9c4]/20 bg-[#04080f]/75 hover:border-[#d4a353] text-[#8fa1b5] hover:text-[#e8eef5] rounded-[2px] cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs sm:text-sm text-[#e8eef5]/90 leading-relaxed">{config.prompt}</p>

          {/* Puzzle Body by Kind */}
          {config.kind === 'fusebox' && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2.5">
                {['I', 'II', 'III', 'IV'].map((roman, idx) => {
                  const isOn = switches[idx];
                  return (
                    <button
                      key={roman}
                      type="button"
                      onClick={() => handleToggleSwitch(idx)}
                      className={`min-h-[104px] flex flex-col items-center justify-between p-3 border rounded-[2px] cursor-pointer transition-colors ${
                        isOn
                          ? 'border-[#d4a353] bg-[#d4a353]/14 text-[#e8eef5]'
                          : 'border-[#78a9c4]/20 bg-[#04080f]/75 text-[#8fa1b5]'
                      }`}
                    >
                      <span className="font-tech text-xs">SAKLAR {roman}</span>
                      <div
                        className={`w-7 h-10 rounded-[2px] border flex items-center justify-center transition-all ${
                          isOn
                            ? 'bg-[#d4a353] border-[#fef08a] translate-y-[-4px]'
                            : 'bg-[#121c2b] border-[#78a9c4]/30 translate-y-[4px]'
                        }`}
                      >
                        <div className="w-3 h-1 bg-[#04080f]/70" />
                      </div>
                      <span
                        className={`font-tech text-[11px] font-semibold ${
                          isOn ? 'text-[#d4a353]' : 'text-[#8fa1b5]'
                        }`}
                      >
                        {isOn ? 'NYALA' : 'MATI'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleVerifyFusebox}
                className="w-full min-h-[44px] bg-[#d4a353] hover:bg-[#e0b467] text-[#04080f] font-semibold text-xs tracking-wider rounded-[2px] cursor-pointer transition-colors"
              >
                ALIRKAN DAYA RUANG MUSIK
              </button>
            </div>
          )}

          {config.kind === 'keypad' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 py-3 border border-[#78a9c4]/25 bg-[#04080f]/90 rounded-[2px]">
                {[0, 1, 2].map((slot) => (
                  <div
                    key={slot}
                    className="w-12 h-14 flex items-center justify-center border border-[#78a9c4]/30 bg-[#0b1320] font-tech text-2xl font-semibold text-[#d4a353] rounded-[2px]"
                  >
                    {digits[slot] ?? '·'}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleKeypadPress(n)}
                    className="min-h-[44px] border border-[#78a9c4]/20 bg-[#0a121e] hover:border-[#d4a353] font-tech text-base text-[#e8eef5] rounded-[2px] cursor-pointer transition-colors"
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    onSwitchClick?.(-1);
                    setDigits('');
                    setErrorMsg(null);
                  }}
                  className="min-h-[44px] border border-[#c25959]/35 bg-[#0a121e] hover:border-[#c25959] font-tech text-xs text-[#c25959] rounded-[2px] cursor-pointer flex items-center justify-center gap-1"
                >
                  <Delete className="w-3.5 h-3.5" />
                  <span>HAPUS</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="min-h-[44px] border border-[#78a9c4]/20 bg-[#0a121e] hover:border-[#d4a353] font-tech text-base text-[#e8eef5] rounded-[2px] cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleVerifyKeypad}
                  className="min-h-[44px] bg-[#d4a353] hover:bg-[#e0b467] text-[#04080f] font-semibold text-xs tracking-wider rounded-[2px] cursor-pointer"
                >
                  BUKA
                </button>
              </div>
            </div>
          )}

          {config.kind === 'terminal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {dials.map((val, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-2 border border-[#78a9c4]/22 bg-[#04080f]/80 p-3 rounded-[2px]"
                  >
                    <span className="font-tech text-[10px] text-[#8fa1b5]">
                      DIGIT {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDialStep(idx, 1)}
                      className="w-full min-h-[38px] border border-[#78a9c4]/25 bg-[#0a121e] hover:border-[#78a9c4] font-tech text-sm text-[#e8eef5] rounded-[2px] cursor-pointer"
                    >
                      +
                    </button>
                    <div className="font-tech text-3xl font-semibold text-[#78a9c4] tabular-nums py-1">
                      {val}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDialStep(idx, -1)}
                      className="w-full min-h-[38px] border border-[#78a9c4]/25 bg-[#0a121e] hover:border-[#78a9c4] font-tech text-sm text-[#e8eef5] rounded-[2px] cursor-pointer"
                    >
                      −
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleVerifyTerminal}
                className="w-full min-h-[44px] bg-[#78a9c4] hover:bg-[#93bfd6] text-[#04080f] font-semibold text-xs tracking-wider rounded-[2px] cursor-pointer transition-colors"
              >
                SINKRONKAN SUAR SHARE-LOC
              </button>
            </div>
          )}

          {config.kind === 'satgas' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#8fa1b5]">
                <span>Pilih urutan protokol Satgas PPKS (1 → 4):</span>
                <button
                  type="button"
                  onClick={() => {
                    onSwitchClick?.(-1);
                    setSatgasOrder([]);
                    setErrorMsg(null);
                  }}
                  className="font-tech text-[11px] text-[#d4a353] hover:underline cursor-pointer"
                >
                  Atur Ulang
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SATGAS_STEPS.map((st) => {
                  const chosenPos = satgasOrder.indexOf(st.id);
                  const active = chosenPos >= 0;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleSelectSatgasStep(st.id)}
                      className={`text-left p-3.5 border rounded-[2px] cursor-pointer transition-colors ${
                        active
                          ? 'border-[#d4a353] bg-[#d4a353]/14'
                          : 'border-[#78a9c4]/22 bg-[#04080f]/75 hover:border-[#78a9c4]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-ui text-sm font-semibold text-[#e8eef5]">
                          {st.label}
                        </span>
                        {active && (
                          <span className="inline-flex items-center gap-1 font-tech text-[11px] text-[#d4a353]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>#{chosenPos + 1}</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#8fa1b5] mt-1">{st.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="border border-[#c25959]/45 bg-[#c25959]/12 px-3.5 py-2.5 rounded-[2px] text-xs text-[#fca5a5]">
              {errorMsg}
            </div>
          )}

          {/* Contextual Hint & Discovered Clue Status */}
          <div className="border-t border-[#78a9c4]/14 pt-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowHint((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs text-[#78a9c4] hover:text-[#e8eef5] cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>
                  {showHint
                    ? 'Sembunyikan Petunjuk'
                    : hasFoundClue
                      ? `Buka Petunjuk Ditemukan (${relatedClue?.title})`
                      : 'Tampilkan Arah Petunjuk'}
                </span>
              </button>

              <span className="font-tech text-[11px] text-[#8fa1b5]">
                Membuka: {config.unlockTargetLabel}
              </span>
            </div>

            {showHint && (
              <div className="border border-[#78a9c4]/22 bg-[#04080f]/75 px-3.5 py-2.5 rounded-[2px] text-xs text-[#e8eef5]/90 leading-relaxed">
                {hasFoundClue && relatedClue?.clueHint ? relatedClue.clueHint : config.hint}
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onCancel}
                className="min-h-[38px] px-4 py-1.5 border border-[#78a9c4]/20 text-xs text-[#8fa1b5] hover:text-[#e8eef5] rounded-[2px] cursor-pointer"
              >
                {controlMode === 'mobile' ? 'Kembali' : 'Tutup [Esc]'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
