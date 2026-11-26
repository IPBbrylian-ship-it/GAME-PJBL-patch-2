import React, { useState } from 'react';
import { ClipboardCheck, Copy, RotateCcw, Home } from 'lucide-react';
import {
  CONSTITUTIONAL_MAPPINGS,
  LAYER_METAS,
  LayerIndex,
  MirrorResponseRecord,
} from '../types/game';
import { RINDI_PORTRAITS } from '../game/portraits';

interface GameOverModalProps {
  respondentName: string;
  layerIndex: LayerIndex;
  awarenessScore: number;
  frostLevel: number;
  collectedFragments: number;
  jumpscareCount: number;
  responses: MirrorResponseRecord[];
  onRestartStage: () => void;
  onRestart: () => void;
  onReturnToTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  respondentName,
  layerIndex,
  awarenessScore,
  frostLevel,
  collectedFragments,
  jumpscareCount,
  responses,
  onRestartStage,
  onRestart,
  onReturnToTitle,
}) => {
  const [copied, setCopied] = useState(false);
  const currentMeta = LAYER_METAS[layerIndex];

  const handleCopyEvaluation = async () => {
    const lines = [
      '=== DATA EVALUASI PjBL KEWARGANEGARAAN (GAME OVER) ===',
      'Judul Karya: SHATTERED MEMORIES: SUDUT BEKU RINDIANI',
      `Responden: ${respondentName.trim() || 'Anonim'}`,
      'Status Akhir: GAME OVER — NYAWA HABIS (0/5)',
      `Terhenti Pada: ${currentMeta.roman} - ${currentMeta.title}`,
      `Total Tertangkap Bayangan (Jumpscare): ${jumpscareCount}`,
      `Indeks Kesadaran Terkumpul: ${Math.round(awarenessScore)}%`,
      `Tingkat Kebekuan Trauma: ${Math.round(frostLevel * 100)}%`,
      `Fragmen Memori Ditemukan: ${collectedFragments}/6`,
      '',
      'Rekam Refleksi Cermin Psikologis:',
      ...(responses.length > 0
        ? responses.map((r, i) => `  ${i + 1}. ${r.betweenLabel} -> [${r.tag}] (${r.chosenLabel})`)
        : ['  (Belum mencapai interlude Cermin Psikologis)']),
      '',
      'Kerangka Konstitusional PjBL:',
      ...CONSTITUTIONAL_MAPPINGS.map(
        (m) => `  - ${m.pillar} | ${m.pancasilaRef} | ${m.uudRef}`
      ),
      '======================================================',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(lines);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = lines;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-[#04080f]/95 overflow-y-auto touch-pan-y horror-scroll">
      <div className="dossier-frame w-full max-w-2xl border border-[#c25959]/40 backdrop-blur-sm my-auto overflow-hidden">
        <div className="h-[2px] w-full bg-[#c25959]" />

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 border-b border-[#78a9c4]/14 pb-5">
            <div className="w-20 h-24 shrink-0 overflow-hidden rounded-[2px] border border-[#c25959]/45 bg-[#060c16]">
              <img
                src={RINDI_PORTRAITS.traumatized}
                alt="Rindiani membeku"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top scale-125 select-none pointer-events-none"
              />
            </div>

            <div className="space-y-2.5 flex-1 min-w-0">
              <div className="font-tech text-[11px] tracking-wider text-[#c25959]">
                NYAWA 0/5 · KESEMPATAN CADANGAN HABIS
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#e8eef5] leading-tight">
                Kamu Gagal Menyelamatkan Rindiani
              </h1>
              <p className="font-ui text-sm text-[#e8eef5]/85 leading-[1.65]">
                Seluruh nyawa dan kesempatan ulang di babak ini sudah habis. Tanpa pertolongan yang tepat waktu,
                tekanan dan ketakutan kembali membekukan ruang batin Rindiani.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 font-ui text-xs">
              <span className="text-[#e8eef5] font-medium">
                Evaluasi · {respondentName.trim() || 'Anonim'}
              </span>
              <span className="text-[#8fa1b5]">{currentMeta.title}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#78a9c4]/16 bg-[#04080f]/65 rounded-[2px]">
              <div className="p-3.5 border-b border-r sm:border-b-0 border-[#78a9c4]/14">
                <div className="font-ui text-[11px] text-[#8fa1b5]">Lokasi</div>
                <div className="font-tech text-sm font-medium text-[#e8eef5] mt-1">
                  {currentMeta.roman}
                </div>
              </div>
              <div className="p-3.5 border-b sm:border-b-0 sm:border-r border-[#78a9c4]/14">
                <div className="font-ui text-[11px] text-[#8fa1b5]">Nyawa</div>
                <div className="font-tech text-sm font-semibold text-[#c25959] mt-1 tabular-nums">
                  0/5
                </div>
              </div>
              <div className="p-3.5 border-r border-[#78a9c4]/14">
                <div className="font-ui text-[11px] text-[#8fa1b5]">Fragmen</div>
                <div className="font-tech text-sm font-medium text-[#78a9c4] mt-1 tabular-nums">
                  {collectedFragments}/6
                </div>
              </div>
              <div className="p-3.5">
                <div className="font-ui text-[11px] text-[#8fa1b5]">Kesadaran</div>
                <div className="font-tech text-sm font-medium text-[#d4a353] mt-1 tabular-nums">
                  {Math.round(awarenessScore)}%
                </div>
              </div>
            </div>

            <p className="font-ui text-xs text-[#8fa1b5] leading-relaxed border-t border-[#78a9c4]/12 pt-3.5">
              Refleksi Kewarganegaraan: Ketika lingkungan memilih diam dan membiarkan intimidasi terus menekan korban,
              amanat kemanusiaan (Sila ke-2 Pancasila) dan hak atas rasa aman (Pasal 28G ayat (1) UUD NRI 1945) tidak
              terlindungi.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 font-ui border-t border-[#78a9c4]/12">
            <div className="flex flex-wrap items-center gap-2.5 pt-3">
              <button
                type="button"
                onClick={onRestartStage}
                className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 bg-[#d4a353] hover:bg-[#e0b467] text-[#04080f] font-semibold text-xs tracking-wider rounded-[2px] cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ULANGI BABAK INI</span>
              </button>

              <button
                type="button"
                onClick={onRestart}
                className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 border border-[#78a9c4]/25 bg-[#04080f]/75 hover:border-[#d4a353] text-[#e8eef5] text-xs rounded-[2px] cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                <span>Ulangi dari Awal</span>
              </button>

              <button
                type="button"
                onClick={handleCopyEvaluation}
                className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 border border-[#78a9c4]/25 bg-[#04080f]/75 hover:border-[#78a9c4] text-[#78a9c4] text-xs rounded-[2px] cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                {copied ? <ClipboardCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin Evaluasi'}</span>
              </button>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={onReturnToTitle}
                className="min-h-[44px] flex items-center gap-1.5 px-4 py-2.5 border border-[#78a9c4]/20 bg-[#04080f]/65 hover:border-[#d4a353] text-[#8fa1b5] hover:text-[#e8eef5] text-xs rounded-[2px] cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Layar Judul</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
