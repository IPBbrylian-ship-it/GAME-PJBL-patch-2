import React, { useState } from 'react';
import { ClipboardCheck, Copy, RotateCcw, Download } from 'lucide-react';
import {
  CONSTITUTIONAL_MAPPINGS,
  ENDINGS,
  EndingType,
  MirrorResponseRecord,
} from '../types/game';
import { RINDI_PORTRAITS } from '../game/portraits';

interface EndingModalProps {
  respondentName: string;
  awarenessScore: number;
  frostLevel: number;
  collectedFragments: number;
  responses: MirrorResponseRecord[];
  onRestart: () => void;
  onDownloadStandalone: () => void;
}

export const EndingModal: React.FC<EndingModalProps> = ({
  respondentName,
  awarenessScore,
  frostLevel,
  collectedFragments,
  responses,
  onRestart,
  onDownloadStandalone,
}) => {
  const [copied, setCopied] = useState(false);

  const clampedScore = Math.max(0, Math.min(100, Math.round(awarenessScore)));
  const endingType: EndingType = clampedScore >= 75 ? 'true' : clampedScore >= 45 ? 'neutral' : 'bad';
  const ending = ENDINGS[endingType];
  const outcomePortrait =
    endingType === 'true'
      ? RINDI_PORTRAITS.normal
      : endingType === 'neutral'
        ? RINDI_PORTRAITS.sad
        : RINDI_PORTRAITS.traumatized;

  const categoryLabel =
    clampedScore >= 75
      ? 'Tinggi (Sadar Konstitusi & Berpihak pada Korban)'
      : clampedScore >= 45
        ? 'Sedang (Parsial / Masih Rentan Pendekatan Seremonial)'
        : 'Rendah (Normalisasi Pembiaran & Menyalahkan Korban)';

  const handleCopyClipboard = async () => {
    const lines = [
      '=== ARSIP EVALUASI RISET PjBL KEWARGANEGARAAN ===',
      'Judul Karya: SHATTERED MEMORIES: SUDUT BEKU RINDIANI',
      `Responden: ${respondentName.trim() || 'Anonim'}`,
      `Ending Tercapai: ${ending.title} (${ending.type.toUpperCase()})`,
      `Indeks Kesadaran Konstitusional & Empati: ${clampedScore}%`,
      `Kategori Kesadaran: ${categoryLabel}`,
      `Tingkat Kebekuan Trauma Akhir: ${Math.round(frostLevel * 100)}%`,
      `Fragmen Memori Terkumpul: ${collectedFragments}/6`,
      'Pilar Perlindungan Babak IV: 4/4 Aktif',
      '',
      'Rekam Jawaban Cermin Psikologis:',
      ...responses.map(
        (r, i) => `  ${i + 1}. ${r.betweenLabel} -> [${r.tag}] (${r.chosenLabel})`
      ),
      '',
      'Pemetaan Pancasila & UUD NRI 1945:',
      ...CONSTITUTIONAL_MAPPINGS.map(
        (m) => `  - ${m.pillar} | ${m.pancasilaRef} | ${m.uudRef}`
      ),
      '================================================',
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
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-[#04080f]/94 overflow-y-auto touch-pan-y horror-scroll">
      <div className="dossier-frame w-full max-w-3xl border border-[#78a9c4]/20 backdrop-blur-sm my-auto overflow-hidden">
        {/* Subtle 1px Top Accent */}
        <div className="h-[2px] w-full" style={{ backgroundColor: ending.accentColor }} />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Editorial Ending Header */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-5 border-b border-[#78a9c4]/14 pb-6">
            <div
              className="w-20 h-24 sm:w-24 sm:h-28 shrink-0 overflow-hidden rounded-[2px] border bg-[#060c16]"
              style={{ borderColor: `${ending.accentColor}55` }}
            >
              <img
                src={outcomePortrait}
                alt={`Rindiani — ${ending.title}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top scale-125 select-none pointer-events-none"
              />
            </div>

            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 font-ui text-xs">
                <span style={{ color: ending.accentColor }}>{ending.subtitle}</span>
                <span className="text-[#8fa1b5]">{ending.badgeText}</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#e8eef5] leading-tight">
                {ending.title}
              </h1>

              <p className="font-ui text-sm text-[#e8eef5]/85 leading-[1.65] max-w-2xl">
                {ending.narrative}
              </p>
            </div>
          </div>

          {/* Explicit Pancasila & UUD NRI 1945 Constitutional Synthesis */}
          <div className="space-y-4 border-b border-[#78a9c4]/14 pb-6">
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#d4a353]">
              Tinjauan Pancasila &amp; UUD NRI 1945
            </h2>

            <p className="font-ui text-sm text-[#e8eef5]/90 leading-[1.65]">
              {ending.constitutionalSynthesis}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-2 border-t border-[#78a9c4]/10 font-ui">
              {CONSTITUTIONAL_MAPPINGS.map((m) => (
                <div key={m.pillar} className="space-y-1">
                  <div className="text-sm font-semibold text-[#e8eef5]">{m.pillar}</div>
                  <div className="text-xs text-[#d4a353]">{m.pancasilaRef}</div>
                  <div className="text-xs text-[#78a9c4]">{m.uudRef}</div>
                  <p className="text-xs text-[#8fa1b5] leading-relaxed pt-0.5">{m.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Research Recap KPI Strip */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 font-ui text-xs">
              <span className="text-[#e8eef5] font-medium">
                Rekap Evaluasi · {respondentName.trim() || 'Anonim'}
              </span>
              <span className="font-tech text-[#8fa1b5] tabular-nums">
                Fragmen {collectedFragments}/6 · Pilar 4/4
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 border border-[#78a9c4]/18 bg-[#04080f]/65 rounded-[2px] divide-y sm:divide-y-0 sm:divide-x divide-[#78a9c4]/14">
              <div className="p-4">
                <div className="font-ui text-xs text-[#8fa1b5]">Kesadaran &amp; Empati</div>
                <div
                  className="font-tech text-2xl sm:text-3xl font-semibold tabular-nums mt-1"
                  style={{ color: ending.accentColor }}
                >
                  {clampedScore}%
                </div>
              </div>

              <div className="p-4">
                <div className="font-ui text-xs text-[#8fa1b5]">Kebekuan Akhir</div>
                <div className="font-tech text-2xl sm:text-3xl font-semibold tabular-nums text-[#78a9c4] mt-1">
                  {Math.round(frostLevel * 100)}%
                </div>
              </div>

              <div className="p-4">
                <div className="font-ui text-xs text-[#8fa1b5]">Klasifikasi</div>
                <div className="font-ui text-xs text-[#e8eef5] mt-1.5 leading-relaxed">
                  {categoryLabel}
                </div>
              </div>
            </div>

            {responses.length > 0 && (
              <div className="divide-y divide-[#78a9c4]/10 border-t border-b border-[#78a9c4]/14 font-ui text-xs">
                {responses.map((r, i) => (
                  <div
                    key={r.questionId}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                  >
                    <span className="text-[#e8eef5]/90">
                      Cermin {i + 1}: {r.chosenLabel}
                    </span>
                    <span className="font-tech text-[11px] text-[#d4a353]">{r.tag}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 font-ui">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyClipboard}
                className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 bg-[#d4a353] hover:bg-[#e0b467] text-[#04080f] font-semibold text-xs tracking-wider rounded-[2px] cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                {copied ? <ClipboardCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Data Tersalin' : 'Salin Data'}</span>
              </button>

              <button
                type="button"
                onClick={onDownloadStandalone}
                className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 border border-[#78a9c4]/25 bg-[#04080f]/75 hover:border-[#78a9c4] text-[#78a9c4] text-xs rounded-[2px] cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh 1-File HTML</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onRestart}
              className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 border border-[#78a9c4]/25 bg-[#04080f]/75 hover:border-[#d4a353] text-[#e8eef5] text-xs rounded-[2px] cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ulangi Permainan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
