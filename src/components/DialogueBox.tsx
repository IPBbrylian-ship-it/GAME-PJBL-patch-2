import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { ControlMode, DialogueLine } from '../types/game';
import { preloadPortraits, resolveDialoguePortrait } from '../game/portraits';

interface DialogueBoxProps {
  lines: DialogueLine[];
  controlMode?: ControlMode;
  onTypeBlip: (index: number) => void;
  onAudioCue: (cue: NonNullable<DialogueLine['cue']>) => void;
  onLineChange?: (lineIndex: number) => void;
  onComplete: () => void;
}

function getSpeakerAccent(speaker: string): string {
  const s = speaker.toLowerCase();
  if (s.includes('rindi')) return '#78a9c4';
  if (s.includes('bima')) return '#d4a353';
  if (s.includes('bayangan') || s.includes('bisikan') || s.includes('gema') || s.includes('layar')) {
    return '#c25959';
  }
  return '#e8eef5';
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  lines,
  controlMode = 'pc',
  onTypeBlip,
  onAudioCue,
  onLineChange,
  onComplete,
}) => {
  const [lineIdx, setLineIdx] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const firedCueRef = useRef<number>(-1);

  const currentLine = lines[lineIdx];
  const fullText = currentLine?.text ?? '';
  const isTyping = charCount < fullText.length;

  useEffect(() => {
    preloadPortraits();
  }, []);

  useEffect(() => {
    setLineIdx(0);
    setCharCount(0);
    firedCueRef.current = -1;
  }, [lines]);

  useEffect(() => {
    onLineChange?.(lineIdx);
  }, [lineIdx, lines, onLineChange]);

  useEffect(() => {
    if (!currentLine) return;
    if (currentLine.cue && firedCueRef.current !== lineIdx) {
      firedCueRef.current = lineIdx;
      onAudioCue(currentLine.cue);
    }
  }, [currentLine, lineIdx, onAudioCue]);

  useEffect(() => {
    if (!isTyping) return;
    const timer = window.setTimeout(() => {
      setCharCount((prev) => {
        const next = prev + 1;
        if (next % 2 === 1) {
          onTypeBlip(next);
        }
        return next;
      });
    }, 24);
    return () => window.clearTimeout(timer);
  }, [charCount, isTyping, onTypeBlip]);

  const handleAdvance = useCallback(() => {
    if (!currentLine) {
      onComplete();
      return;
    }
    if (isTyping) {
      setCharCount(fullText.length);
      return;
    }
    if (lineIdx + 1 < lines.length) {
      setLineIdx((prev) => prev + 1);
      setCharCount(0);
    } else {
      onComplete();
    }
  }, [currentLine, fullText.length, isTyping, lineIdx, lines.length, onComplete]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
        e.preventDefault();
        handleAdvance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleAdvance]);

  if (!currentLine) return null;

  const tapHint = controlMode === 'mobile' ? 'Ketuk layar' : 'Spasi / Klik';
  const speakerColor = getSpeakerAccent(currentLine.speaker);
  const portrait = resolveDialoguePortrait(currentLine);
  const progressPct = ((lineIdx + 1) / Math.max(1, lines.length)) * 100;

  return (
    <div
      onClick={handleAdvance}
      role="button"
      tabIndex={0}
      aria-label={isTyping ? 'Tampilkan seluruh kalimat' : 'Lanjutkan dialog'}
      style={{ touchAction: 'manipulation' }}
      className="fixed inset-x-0 bottom-0 z-30 flex justify-center pt-14 pb-4 px-4 sm:pb-6 sm:px-6 md:pb-8 cursor-pointer bg-gradient-to-t from-[#04080f]/88 via-[#04080f]/45 to-transparent"
    >
      <div className="dossier-frame w-full max-w-2xl border border-[#78a9c4]/20 backdrop-blur-sm px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start gap-3.5 sm:gap-5">
          {portrait && (
            <div
              className="w-[74px] h-[88px] sm:w-[92px] sm:h-[108px] shrink-0 overflow-hidden rounded-[2px] border bg-[#060c16] relative"
              style={{ borderColor: `${portrait.accentColor}48` }}
            >
              <img
                src={portrait.url}
                alt={`${portrait.label} (${portrait.expression})`}
                referrerPolicy="no-referrer"
                draggable={false}
                className="w-full h-full object-cover object-top scale-125 select-none pointer-events-none"
              />
              <div
                className="absolute inset-x-0 bottom-0 h-[2px]"
                style={{ backgroundColor: portrait.accentColor }}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Speaker & Emotion Header */}
            <div className="flex items-baseline justify-between gap-4 border-b border-[#78a9c4]/14 pb-2 mb-2.5">
              <div className="flex flex-wrap items-baseline gap-2 min-w-0">
                <span
                  className="font-display text-lg sm:text-xl font-semibold tracking-wide"
                  style={{ color: speakerColor }}
                >
                  {currentLine.speaker}
                </span>
                <span className="text-[#8fa1b5]/50" aria-hidden="true">
                  ·
                </span>
                <span className="font-ui text-xs text-[#8fa1b5]">{currentLine.emotion}</span>
              </div>
              <span className="font-tech text-[11px] tabular-nums text-[#8fa1b5] shrink-0">
                {lineIdx + 1}/{lines.length}
              </span>
            </div>

            {/* Clean Sans Dialogue Prose */}
            <p className="font-ui text-sm sm:text-[15px] text-[#e8eef5] leading-[1.65] min-h-[3.25rem]">
              {fullText.slice(0, charCount)}
              {isTyping && (
                <span className="cursor-blink inline-block w-1.5 h-4 ml-1 bg-[#d4a353] align-middle" />
              )}
            </p>
          </div>
        </div>

        {/* Progress Hairline & Continue Cue */}
        <div className="mt-3.5 pt-2.5 border-t border-[#78a9c4]/10 flex items-center justify-between gap-4">
          <div className="h-[1.5px] flex-1 max-w-[120px] bg-[#121c2b] overflow-hidden">
            <div
              className="h-full bg-[#78a9c4]/70 transition-[width] duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="inline-flex items-center gap-1 font-ui text-xs text-[#8fa1b5]">
            <span>{isTyping ? `${tapHint} untuk tampil penuh` : `${tapHint} untuk lanjut`}</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#d4a353]" />
          </span>
        </div>
      </div>
    </div>
  );
};
