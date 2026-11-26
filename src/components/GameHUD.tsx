import React, { useEffect, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  EyeOff,
  Monitor,
  Smartphone,
  RotateCw,
  X,
  BookOpen,
  Heart,
} from 'lucide-react';
import { ControlMode, HudSnapshot, LAYER_METAS } from '../types/game';

interface GameHUDProps {
  hud: HudSnapshot;
  muted: boolean;
  controlMode: ControlMode;
  onToggleControlMode: () => void;
  onToggleMute: () => void;
  onOpenJournal: () => void;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hud,
  muted,
  controlMode,
  onToggleControlMode,
  onToggleMute,
  onOpenJournal,
  onPause,
}) => {
  const [isPortrait, setIsPortrait] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false
  );
  const [dismissedPortraitHint, setDismissedPortraitHint] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const meta = LAYER_METAS[hud.layerIndex];
  const dangerRatio = Math.max(0, Math.min(1, 1 - (hud.threatDistance - 2.0) / 11));
  const lanternReady = hud.lanternCooldown <= 0.01;
  const crackLevel = Math.max(0, hud.maxLives - hud.lives);
  const isMobile = controlMode === 'mobile';
  const hasInteractPrompt = Boolean(hud.promptText);

  // Subtle horror scaling at low lives (1–2), strictly disabled during calm_before
  const allowHorrorFx = hud.storyPhase !== 'calm_before';
  const healthRatio = hud.lives / Math.max(1, hud.maxLives);
  const lowHealthTier = !allowHorrorFx
    ? 0
    : hud.lives <= 1
      ? 3
      : hud.lives <= 2
        ? 2
        : hud.lives <= 3
          ? 1
          : 0;
  const vignetteStrength = allowHorrorFx
    ? Math.min(0.84, 0.22 + hud.frostLevel * 0.22 + dangerRatio * 0.34 + lowHealthTier * 0.095)
    : 0;
  const crimsonVignette = allowHorrorFx && (dangerRatio > 0.35 || lowHealthTier >= 2);
  const vignetteInnerClear = lowHealthTier >= 3 ? 36 : lowHealthTier >= 2 ? 41 : 46;

  // Adaptive visibility: dim calm/full indicators so exploration remains unobstructed
  const staminaActive = hud.stamina < 98;
  const warmthAlert = hud.warmth <= 45;
  const livesLow = hud.lives <= 2;
  const livesCritical = hud.lives <= 1;

  return (
    <div className="fixed inset-0 z-[14] pointer-events-none select-none overflow-hidden">
      {/* Dynamic Freezing, Threat & Low-Lives Vignette */}
      {allowHorrorFx && (
        <div
          className={`frost-vignette absolute inset-0 ${lowHealthTier >= 2 ? 'low-health-pulse' : ''}`}
          style={{
            background: `radial-gradient(circle at center, transparent ${vignetteInnerClear}%, rgba(${
              crimsonVignette ? (lowHealthTier >= 3 ? '122, 16, 22' : '138, 28, 28') : '10, 42, 66'
            }, ${vignetteStrength}) 100%)`,
          }}
        />
      )}

      {/* Brief Crimson Damage Flash When Losing 1 Life */}
      {hud.damageFlash > 0.01 && (
        <div
          className="absolute inset-0 transition-opacity duration-75"
          style={{
            backgroundColor: `rgba(194, 45, 58, ${(hud.damageFlash * 0.34).toFixed(3)})`,
          }}
        />
      )}

      {/* Critical Lives (1/5) Subtle Screen-Edge Chromatic Glitch Pulse */}
      {lowHealthTier >= 3 && (
        <div
          className="critical-edge-glitch absolute inset-0"
          style={{
            boxShadow:
              'inset 6px 0 28px rgba(194, 45, 58, 0.34), inset -6px 0 28px rgba(56, 132, 184, 0.26)',
          }}
        />
      )}

      {/* Jumpscare Red/Blue Strobe Overlay */}
      {hud.strobePhase !== 'none' && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor:
              hud.strobePhase === 'red' ? 'rgba(220, 38, 38, 0.26)' : 'rgba(37, 99, 235, 0.26)',
          }}
        />
      )}

      {/* Progressive Screen-Edge Ice Cracks (1–4 hits) */}
      {crackLevel > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
          viewBox="0 0 1000 600"
          preserveAspectRatio="none"
        >
          <g stroke="rgba(186, 230, 253, 0.55)" strokeWidth={1.3 + crackLevel * 0.3} fill="none">
            <polyline points="0,0 74,48 118,38 175,92 162,135" />
            <polyline points="74,48 52,102 96,144" />
            <polyline points="118,38 158,14 215,24" />
          </g>
          {crackLevel >= 2 && (
            <g stroke="rgba(186, 230, 253, 0.62)" strokeWidth={1.5 + crackLevel * 0.3} fill="none">
              <polyline points="1000,600 912,535 865,552 805,488 818,438" />
              <polyline points="912,535 942,468 896,422" />
              <polyline points="865,552 818,582 758,568" />
            </g>
          )}
          {crackLevel >= 3 && (
            <g stroke="rgba(224, 242, 254, 0.7)" strokeWidth={1.7 + crackLevel * 0.3} fill="none">
              <polyline points="1000,0 915,62 855,48 795,112 814,172" />
              <polyline points="915,62 948,132 895,184" />
              <polyline points="855,48 802,18 738,34" />
            </g>
          )}
          {crackLevel >= 4 && (
            <g stroke="rgba(248, 113, 113, 0.72)" strokeWidth="2.1" fill="none">
              <polyline points="0,600 95,522 148,540 218,475 204,412" />
              <polyline points="95,522 65,442 125,388" />
              <polyline points="175,92 248,142 292,126" />
              <polyline points="805,488 738,442 695,460" />
            </g>
          )}
        </svg>
      )}

      {/* Portrait Suggestion Banner (Mobile Only) */}
      {isMobile && isPortrait && !dismissedPortraitHint && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 max-w-[90vw] pointer-events-auto">
          <div className="flex items-center gap-2 border border-[#78a9c4]/30 bg-[#04080f]/85 backdrop-blur-xs px-2.5 py-1 rounded-[2px] text-[11px] font-ui text-[#8fa1b5]">
            <RotateCw className="w-3 h-3 text-[#d4a353] shrink-0" />
            <span>Putar Landscape untuk kontrol optimal</span>
            <button
              type="button"
              onClick={() => setDismissedPortraitHint(true)}
              aria-label="Tutup saran landscape"
              className="p-1 text-[#8fa1b5] hover:text-[#e8eef5] cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Top Row: Compact Status & Objective (Left) + Subtle Utility Controls (Right) */}
      <div className="relative flex items-start justify-between p-3 sm:p-5 gap-3">
        <div className="w-[178px] sm:w-[202px] space-y-2">
          {/* Group 1: Character Status & Equipment */}
          <div
            className={`border bg-[#04080f]/62 backdrop-blur-xs px-2.5 py-2 rounded-[2px] space-y-2 transition-colors ${
              livesCritical ? 'border-[#c25959]/45' : 'border-[#78a9c4]/18'
            }`}
          >
            {/* 5-Lives Survival Indicator */}
            <div>
              <div className="flex items-center justify-between font-tech text-[10px] tracking-[0.08em]">
                <span className={livesLow ? 'text-[#c25959]' : 'text-[#8fa1b5]'}>NYAWA</span>
                <div className="flex items-center gap-1.5">
                  {!hud.extraRetryAvailable && (
                    <span className="text-[9px] text-[#d4a353]">CADANGAN HABIS</span>
                  )}
                  <span
                    className={`tabular-nums font-medium ${
                      livesLow ? 'text-[#c25959]' : 'text-[#e8eef5]'
                    }`}
                  >
                    {hud.lives}/{hud.maxLives}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                {Array.from({ length: hud.maxLives }).map((_, i) => {
                  const intact = i < hud.lives;
                  return (
                    <Heart
                      key={i}
                      className={`w-4 h-4 transition-all duration-200 ${
                        intact
                          ? livesCritical
                            ? 'fill-[#c25959] text-[#f87171] animate-pulse'
                            : livesLow
                              ? 'fill-[#c25959] text-[#c25959]'
                              : 'fill-[#e05663] text-[#f48b94]'
                          : 'fill-transparent text-[#8fa1b5]/28'
                      }`}
                    />
                  );
                })}
              </div>
              {hud.graceTimer > 0 && (
                <div className="font-tech text-[10px] text-[#d4a353] tabular-nums mt-1">
                  AMAN SEJENAK · {hud.graceTimer.toFixed(1)}s
                </div>
              )}
            </div>

            {/* Warmth, Stamina & Lantern */}
            <div className="space-y-1.5 pt-1 border-t border-[#78a9c4]/12">
              <div>
                <div className="flex items-center justify-between font-tech text-[10px]">
                  <span className={warmthAlert ? 'text-[#c25959]' : 'text-[#8fa1b5]'}>HANGAT</span>
                  <span
                    className="tabular-nums"
                    style={{ color: warmthAlert ? '#c25959' : '#e8eef5' }}
                  >
                    {hud.warmth}%
                  </span>
                </div>
                <div className="h-[2px] w-full bg-[#121c2b] mt-0.5 overflow-hidden">
                  <div
                    className="h-full transition-[width] duration-150"
                    style={{
                      width: `${hud.warmth}%`,
                      backgroundColor: warmthAlert ? '#c25959' : '#78a9c4',
                    }}
                  />
                </div>
              </div>

              <div className={`transition-opacity duration-200 ${staminaActive ? 'opacity-100' : 'opacity-45'}`}>
                <div className="flex items-center justify-between font-tech text-[10px]">
                  <span className="text-[#8fa1b5]">{isMobile ? 'NAPAS' : 'NAPAS · SHIFT'}</span>
                  <span className="tabular-nums text-[#e8eef5]">{hud.stamina}%</span>
                </div>
                <div className="h-[2px] w-full bg-[#121c2b] mt-0.5 overflow-hidden">
                  <div
                    className="h-full bg-[#8fa1b5] transition-[width] duration-100"
                    style={{ width: `${hud.stamina}%` }}
                  />
                </div>
              </div>

              {!isMobile && (
                <div
                  className={`transition-opacity duration-200 ${
                    !lanternReady || hud.lanternActive ? 'opacity-100' : 'opacity-65'
                  }`}
                >
                  <div className="flex items-center justify-between font-tech text-[10px]">
                    <span className={lanternReady ? 'text-[#d4a353]' : 'text-[#8fa1b5]'}>
                      LENTERA · F
                    </span>
                    <span
                      className="tabular-nums"
                      style={{ color: lanternReady ? '#d4a353' : '#78a9c4' }}
                    >
                      {lanternReady ? 'SIAP' : 'ISI'}
                    </span>
                  </div>
                  <div className="h-[2px] w-full bg-[#121c2b] mt-0.5 overflow-hidden">
                    <div
                      className="h-full transition-[width] duration-100"
                      style={{
                        width: `${Math.round((1 - hud.lanternCooldown) * 100)}%`,
                        backgroundColor: lanternReady ? '#d4a353' : '#78a9c4',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Group 2: Compact Chapter & Objective Indicator */}
          <div className="border border-[#78a9c4]/14 bg-[#04080f]/52 backdrop-blur-xs px-2.5 py-1.5 rounded-[2px]">
            <div className="flex items-center justify-between gap-2 font-tech text-[10px] text-[#8fa1b5]">
              <span className="truncate">{meta.roman}</span>
              <span className="tabular-nums font-medium shrink-0 text-[#8fa1b5]">
                ARSIP {hud.cluesFound}/{hud.cluesTotal} ·{' '}
                <span style={{ color: hud.exitUnlocked ? '#d4a353' : '#e8eef5' }}>
                  {hud.collectedCount}/{hud.totalTargets}
                </span>
              </span>
            </div>
            <div className="font-ui text-xs font-medium text-[#e8eef5] truncate mt-0.5">
              {meta.title}
            </div>
            {hud.exitUnlocked ? (
              <div className="font-ui text-[11px] text-[#d4a353] truncate mt-0.5">
                Menuju {meta.exitLabel} {isMobile ? '[AKSI]' : '[E]'}
              </div>
            ) : (
              <div className="font-ui text-[11px] text-[#8fa1b5] truncate mt-0.5">
                {hud.activeObjectiveHint || meta.ambientHint}
              </div>
            )}
          </div>
        </div>

        {/* Top-Right: Minimal Utility Icon Controls */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenJournal();
              }}
              title="Arsip Petunjuk (J)"
              aria-label="Buka Arsip Petunjuk"
              className={`${
                isMobile ? 'min-h-[44px] px-3' : 'min-h-[38px] px-2.5'
              } flex items-center gap-1.5 border border-[#78a9c4]/18 bg-[#04080f]/58 backdrop-blur-xs text-[#8fa1b5] hover:text-[#e8eef5] hover:border-[#d4a353]/60 rounded-[2px] transition-colors cursor-pointer`}
            >
              <BookOpen className="w-4 h-4 text-[#d4a353]" />
              <span className="font-tech text-[10px] tabular-nums hidden sm:inline">
                ARSIP {hud.cluesFound}/{hud.cluesTotal}
              </span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleControlMode();
              }}
              title={isMobile ? 'Mode Mobile (Klik ganti PC)' : 'Mode PC (Klik ganti Mobile)'}
              aria-label={isMobile ? 'Ganti ke kontrol PC' : 'Ganti ke kontrol Mobile'}
              className={`${
                isMobile ? 'min-h-[44px] min-w-[44px]' : 'min-h-[38px] min-w-[38px]'
              } flex items-center justify-center border border-[#78a9c4]/18 bg-[#04080f]/58 backdrop-blur-xs text-[#8fa1b5] hover:text-[#e8eef5] hover:border-[#d4a353]/60 rounded-[2px] transition-colors cursor-pointer`}
            >
              {isMobile ? (
                <Smartphone className="w-4 h-4 text-[#78a9c4]" />
              ) : (
                <Monitor className="w-4 h-4 text-[#8fa1b5]" />
              )}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
              }}
              title={muted ? 'Aktifkan Suara' : 'Bisukan Suara'}
              aria-label={muted ? 'Aktifkan Suara' : 'Bisukan Suara'}
              className={`${
                isMobile ? 'min-h-[44px] min-w-[44px]' : 'min-h-[38px] min-w-[38px]'
              } flex items-center justify-center border border-[#78a9c4]/18 bg-[#04080f]/58 backdrop-blur-xs text-[#8fa1b5] hover:text-[#e8eef5] hover:border-[#d4a353]/60 rounded-[2px] transition-colors cursor-pointer`}
            >
              {muted ? (
                <VolumeX className="w-4 h-4 text-[#c25959]" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#78a9c4]" />
              )}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPause();
              }}
              title="Jeda (Esc)"
              aria-label="Jeda permainan"
              className={`${
                isMobile ? 'min-h-[44px] min-w-[44px]' : 'min-h-[38px] min-w-[38px]'
              } flex items-center justify-center border border-[#78a9c4]/18 bg-[#04080f]/58 backdrop-blur-xs text-[#8fa1b5] hover:text-[#e8eef5] hover:border-[#d4a353]/60 rounded-[2px] transition-colors cursor-pointer`}
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          {!isMobile && !hud.isPointerLocked && (
            <div className="hidden sm:block font-ui text-[11px] text-[#8fa1b5]/80">
              Klik layar untuk menoleh · Esc jeda
            </div>
          )}
        </div>
      </div>

      {/* Center Minimal Reticle & Contextual Prompt */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4">
        {hud.isHiding ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 border border-[#78a9c4]/35 bg-[#04080f]/82 backdrop-blur-xs rounded-[2px] text-[#78a9c4] text-xs font-ui">
            <EyeOff className="w-3.5 h-3.5" />
            <span>Bersembunyi</span>
          </div>
        ) : (
          <div
            className={`rounded-full transition-all duration-150 ${
              hasInteractPrompt
                ? 'w-1.5 h-1.5 bg-[#d4a353] shadow-[0_0_8px_rgba(212,163,83,0.75)]'
                : 'w-1 h-1 bg-[#e8eef5]/60'
            }`}
          />
        )}

        {hud.promptText && (
          <div className="mt-5 px-3.5 py-2 border border-[#d4a353]/45 bg-[#04080f]/84 backdrop-blur-xs rounded-[2px] text-center max-w-xs sm:max-w-sm">
            <div className="font-ui text-xs font-medium text-[#e8eef5]">
              {isMobile ? hud.promptText.replace('[E]', '[AKSI]') : hud.promptText}
            </div>
            {hud.promptSubtext && (
              <div className="font-ui text-[11px] text-[#8fa1b5] mt-0.5">{hud.promptSubtext}</div>
            )}
          </div>
        )}
      </div>

      {/* Group 3: Environment Frost Readout (Bottom-Right, Desktop/Tablet) */}
      {!isMobile && (
        <div className="hidden md:flex absolute bottom-5 right-5 items-center gap-2 font-tech text-[11px] text-[#8fa1b5]/80 tabular-nums">
          <span>BEKU</span>
          <span className="text-[#78a9c4]">{Math.round(hud.frostLevel * 100)}%</span>
        </div>
      )}
    </div>
  );
};
