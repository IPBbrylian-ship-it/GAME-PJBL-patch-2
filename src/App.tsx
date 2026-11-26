import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, FastForward } from 'lucide-react';
import {
  ControlMode,
  CutsceneOverlayState,
  DifficultyMode,
  DialogueLine,
  EndingType,
  GamePhase,
  HudSnapshot,
  LAYER_METAS,
  LayerIndex,
  MIRROR_QUESTIONS,
  MirrorOption,
  MirrorResponseRecord,
} from './types/game';
import { HorrorAudioEngine } from './game/audio';
import { SudutBekuEngine } from './game/engine';
import { LORE_CLUES, PUZZLE_CONFIGS } from './game/lore';
import { resolvePortraitForSpeaker } from './game/portraits';
import { downloadStandaloneHtml } from './game/standaloneExporter';
import { TitleScreen } from './components/TitleScreen';
import { DialogueBox } from './components/DialogueBox';
import { GameHUD } from './components/GameHUD';
import { MobileControls } from './components/MobileControls';
import { MirrorModal } from './components/MirrorModal';
import { EndingModal } from './components/EndingModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { InspectModal } from './components/InspectModal';
import { PuzzleModal } from './components/PuzzleModal';
import { JournalModal } from './components/JournalModal';
import { CheckpointRetryModal } from './components/CheckpointRetryModal';

function detectDefaultControlMode(): ControlMode {
  if (typeof window === 'undefined') return 'pc';
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return hasTouch ? 'mobile' : 'pc';
}

interface ActiveDialogueState {
  lines: DialogueLine[];
  onComplete: () => void;
}

const INITIAL_HUD: HudSnapshot = {
  layerIndex: 0,
  lives: 5,
  maxLives: 5,
  extraRetryAvailable: true,
  damageFlash: 0,
  jumpscareCount: 0,
  graceTimer: 0,
  strobePhase: 'none',
  warmth: 100,
  stamina: 100,
  lanternCooldown: 0,
  lanternActive: false,
  isHiding: false,
  isPointerLocked: false,
  collectedCount: 0,
  totalTargets: LAYER_METAS[0].totalTargets,
  cluesFound: 0,
  cluesTotal: Object.keys(LORE_CLUES).length,
  solvedPuzzlesCount: 0,
  totalPuzzlesCount: Object.keys(PUZZLE_CONFIGS).length,
  activeObjectiveHint: LAYER_METAS[0].ambientHint,
  exitUnlocked: false,
  frostLevel: 0.38,
  threatDistance: 99,
  storyPhase: 'calm_before',
  horrorBlend: 0,
  promptText: null,
  promptSubtext: null,
};

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<SudutBekuEngine | null>(null);
  const audioRef = useRef<HorrorAudioEngine | null>(null);

  const [phase, setPhase] = useState<GamePhase>('title');
  const [muted, setMuted] = useState(false);
  const [cinematicEffects, setCinematicEffects] = useState(true);
  const [difficulty, setDifficulty] = useState<DifficultyMode>('standard');
  const [controlMode, setControlMode] = useState<ControlMode>(detectDefaultControlMode);
  const [respondentName, setRespondentName] = useState('');
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);

  const [mirrorIndex, setMirrorIndex] = useState<number>(0);
  const [awarenessScore, setAwarenessScore] = useState<number>(0);
  const [frostLevel, setFrostLevel] = useState<number>(0.38);
  const [responses, setResponses] = useState<MirrorResponseRecord[]>([]);
  const [collectedFragments, setCollectedFragments] = useState<number>(0);
  const [jumpscareCount, setJumpscareCount] = useState<number>(0);
  const [cutsceneState, setCutsceneState] = useState<CutsceneOverlayState | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<ActiveDialogueState | null>(null);
  const [activeLoreId, setActiveLoreId] = useState<string | null>(null);
  const [activePuzzleId, setActivePuzzleId] = useState<string | null>(null);
  const [discoveredClues, setDiscoveredClues] = useState<string[]>([]);
  const [solvedPuzzles, setSolvedPuzzles] = useState<string[]>([]);
  const [contextLost, setContextLost] = useState(false);

  // Refs for stable engine callbacks (prevents WebGL engine re-creation on state updates)
  const awarenessScoreRef = useRef<number>(0);
  const activeDialogueRef = useRef<ActiveDialogueState | null>(null);

  const handleDialogueRequested = useCallback((lines: DialogueLine[], onComplete: () => void) => {
    const nextState: ActiveDialogueState = { lines, onComplete };
    activeDialogueRef.current = nextState;
    setActiveDialogue(nextState);
    setPhase((prev) => (prev === 'prologue' || prev === 'epilogue' ? prev : 'dialogue'));
  }, []);

  const handleDialogueComplete = useCallback(() => {
    const current = activeDialogueRef.current;
    activeDialogueRef.current = null;
    setActiveDialogue(null);
    if (!current) return;
    setPhase('playing');
    current.onComplete();
  }, []);

  const handleTypeBlip = useCallback((index: number) => {
    audioRef.current?.playTypeBlip(index);
  }, []);

  const handleAudioCue = useCallback((cue: NonNullable<DialogueLine['cue']>) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (cue === 'clock') audio.playClockToll();
    else if (cue === 'whisper') audio.playWhisperStatic();
    else if (cue === 'door') audio.playDoorSlam();
    else if (cue === 'ice') audio.playIceShatter();
    else if (cue === 'chime') audio.playMemoryChime();
  }, []);

  const handleLayerCompleted = useCallback((completedLayer: LayerIndex) => {
    if (completedLayer < 3) {
      setMirrorIndex(completedLayer);
      setPhase('mirror');
    } else {
      const frags = engineRef.current?.getCollectedFragmentsCount() ?? 0;
      const frost = engineRef.current?.getFrostLevel() ?? 0.38;
      const finalScore = Math.max(0, Math.min(100, Math.round(awarenessScoreRef.current)));
      const endingType: EndingType =
        finalScore >= 75 ? 'true' : finalScore >= 45 ? 'neutral' : 'bad';

      setCollectedFragments(frags);
      setFrostLevel(frost);
      setPhase('epilogue');
      engineRef.current?.startEpilogue(endingType, () => {
        setPhase('ending');
      });
    }
  }, []);

  const handlePauseRequested = useCallback(() => {
    setPhase((prev) => {
      if (prev === 'playing') {
        engineRef.current?.setPhase('paused');
        return 'paused';
      }
      return prev;
    });
  }, []);

  const handleGameOver = useCallback(() => {
    setCollectedFragments(engineRef.current?.getCollectedFragmentsCount() ?? 0);
    setJumpscareCount(engineRef.current?.getJumpscareCount() ?? 5);
    setFrostLevel(engineRef.current?.getFrostLevel() ?? 0.38);
    setCutsceneState(null);
    setPhase('gameover');
  }, []);

  const handleCheckpointRetryRequested = useCallback(() => {
    setCutsceneState(null);
    setActiveLoreId(null);
    setActivePuzzleId(null);
    setPhase('retry');
  }, []);

  const handleUseCheckpointRetry = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.useCheckpointRetry();
    setDiscoveredClues(engine.getDiscoveredClues());
    setSolvedPuzzles(engine.getSolvedPuzzles());
    setPhase('playing');
  }, []);

  const handleRestartCurrentStage = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.restartCurrentStage();
    setDiscoveredClues(engine.getDiscoveredClues());
    setSolvedPuzzles(engine.getSolvedPuzzles());
    setActiveLoreId(null);
    setActivePuzzleId(null);
    setCutsceneState(null);
    setPhase('playing');
  }, []);

  const handleCutsceneStateChange = useCallback((state: CutsceneOverlayState | null) => {
    setCutsceneState(state);
    if (state !== null) {
      setPhase('cutscene');
    } else {
      setPhase((prev) => (prev === 'cutscene' ? 'playing' : prev));
    }
  }, []);

  const handleInspectLore = useCallback((loreId: string) => {
    setDiscoveredClues((prev) => (prev.includes(loreId) ? prev : [...prev, loreId]));
    setActiveLoreId(loreId);
    setPhase('inspect');
  }, []);

  const handleOpenPuzzle = useCallback((puzzleId: string) => {
    setActivePuzzleId(puzzleId);
    setPhase('puzzle');
  }, []);

  const handleOpenJournalFromEngine = useCallback(() => {
    setPhase('journal');
  }, []);

  const handleOpenJournalFromHud = useCallback(() => {
    setPhase((prev) => {
      if (prev === 'playing') {
        engineRef.current?.setPhase('journal');
        audioRef.current?.playPaperInspect();
        return 'journal';
      }
      return prev;
    });
  }, []);

  const handleCloseOverlayModal = useCallback(() => {
    setActiveLoreId(null);
    setActivePuzzleId(null);
    setPhase('playing');
    engineRef.current?.resumeFromOverlay();
  }, []);

  const handlePuzzleSolved = useCallback((puzzleId: string) => {
    setSolvedPuzzles((prev) => (prev.includes(puzzleId) ? prev : [...prev, puzzleId]));
    setActivePuzzleId(null);
    setPhase('playing');
    engineRef.current?.completePuzzle(puzzleId);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const audio = new HorrorAudioEngine();
    audioRef.current = audio;

    const engine = new SudutBekuEngine(container, audio, {
      onHudUpdate: (snapshot) => {
        setHud(snapshot);
      },
      onDialogueRequested: handleDialogueRequested,
      onLayerCompleted: handleLayerCompleted,
      onPauseRequested: handlePauseRequested,
      onCheckpointRetryRequested: handleCheckpointRetryRequested,
      onContextLossChange: (lost) => setContextLost(lost),
      onGameOver: handleGameOver,
      onCutsceneStateChange: handleCutsceneStateChange,
      onInspectLore: handleInspectLore,
      onOpenPuzzle: handleOpenPuzzle,
      onOpenJournal: handleOpenJournalFromEngine,
    });
    engineRef.current = engine;
    engine.setControlMode(detectDefaultControlMode());
    engine.setCinematicEffectsEnabled(true);

    return () => {
      engine.dispose();
      audio.dispose();
      engineRef.current = null;
      audioRef.current = null;
    };
  }, [
    handleDialogueRequested,
    handleLayerCompleted,
    handlePauseRequested,
    handleCheckpointRetryRequested,
    handleGameOver,
    handleCutsceneStateChange,
    handleInspectLore,
    handleOpenPuzzle,
    handleOpenJournalFromEngine,
  ]);

  useEffect(() => {
    const unlockAudio = () => {
      audioRef.current?.init();
    };
    window.addEventListener('pointerdown', unlockAudio, { once: true, capture: true });
    window.addEventListener('touchstart', unlockAudio, { once: true, capture: true });
    window.addEventListener('keydown', unlockAudio, { once: true, capture: true });
    return () => {
      window.removeEventListener('pointerdown', unlockAudio, true);
      window.removeEventListener('touchstart', unlockAudio, true);
      window.removeEventListener('keydown', unlockAudio, true);
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setControlMode(controlMode);
  }, [controlMode]);

  useEffect(() => {
    engineRef.current?.setCinematicEffectsEnabled(cinematicEffects);
  }, [cinematicEffects]);

  const handleToggleControlMode = useCallback(() => {
    setControlMode((prev) => (prev === 'pc' ? 'mobile' : 'pc'));
  }, []);

  const handleToggleCinematicEffects = useCallback(() => {
    setCinematicEffects((prev) => !prev);
  }, []);

  const handleToggleMute = useCallback(() => {
    audioRef.current?.init();
    setMuted((prev) => {
      const next = !prev;
      audioRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const handleStartGame = useCallback(() => {
    awarenessScoreRef.current = 0;
    activeDialogueRef.current = null;
    setActiveDialogue(null);
    setAwarenessScore(0);
    setFrostLevel(0.38);
    setResponses([]);
    setCollectedFragments(0);
    setJumpscareCount(0);
    setCutsceneState(null);
    setActiveLoreId(null);
    setActivePuzzleId(null);
    setDiscoveredClues([]);
    setSolvedPuzzles([]);
    setMirrorIndex(0);
    setPhase('prologue');
    engineRef.current?.startPrologue(difficulty);
  }, [difficulty]);

  const handleResume = useCallback(() => {
    setPhase('playing');
    engineRef.current?.setPhase('playing');
    engineRef.current?.requestPointerLock();
  }, []);

  const handleReturnToTitle = useCallback(() => {
    activeDialogueRef.current = null;
    setActiveDialogue(null);
    setActiveLoreId(null);
    setActivePuzzleId(null);
    setPhase('title');
    engineRef.current?.setPhase('title');
  }, []);

  const handleMirrorSelect = useCallback(
    (option: MirrorOption) => {
      const question = MIRROR_QUESTIONS[mirrorIndex];
      const nextScore = awarenessScore + option.awarenessDelta;
      const nextFrost = Math.max(0.15, Math.min(1.0, frostLevel + option.frostDelta));

      awarenessScoreRef.current = nextScore;
      setAwarenessScore(nextScore);
      setFrostLevel(nextFrost);
      setResponses((prev) => [
        ...prev,
        {
          questionId: question.id,
          betweenLabel: question.betweenLabel,
          chosenLabel: option.label,
          tag: option.tag,
          awarenessDelta: option.awarenessDelta,
        },
      ]);

      const nextLayer = (mirrorIndex + 1) as LayerIndex;
      setPhase('playing');
      engineRef.current?.advanceToLayer(nextLayer, nextFrost);
    },
    [awarenessScore, frostLevel, mirrorIndex]
  );

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-screen h-screen overflow-hidden bg-[#04080f] select-none"
    >
      {/* Isolated Three.js WebGL Mount Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Subtle Analog Horror CRT Scanlines & Procedural Film Grain */}
      {cinematicEffects && <div className="ps2-scanlines fixed inset-0 z-[5]" />}
      {cinematicEffects && <div className="film-grain fixed inset-0 z-[6]" />}

      {/* WebGL Context Lost Banner */}
      {contextLost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#04080f]/94 backdrop-blur-xs p-6">
          <div className="dossier-frame max-w-sm border border-[#c25959]/45 p-6 text-center space-y-3 font-ui">
            <AlertTriangle className="w-7 h-7 text-[#c25959] mx-auto" />
            <div className="font-display text-xl font-semibold text-[#e8eef5]">
              Konteks Grafis Terhenti
            </div>
            <p className="text-xs text-[#8fa1b5] leading-relaxed">
              Peramban sedang memulihkan memori WebGL. Tunggu sejenak atau muat ulang halaman jika belum pulih.
            </p>
          </div>
        </div>
      )}

      {/* Title Screen */}
      {phase === 'title' && (
        <TitleScreen
          muted={muted}
          difficulty={difficulty}
          controlMode={controlMode}
          cinematicEffects={cinematicEffects}
          respondentName={respondentName}
          onChangeDifficulty={setDifficulty}
          onChangeControlMode={setControlMode}
          onToggleCinematicEffects={handleToggleCinematicEffects}
          onChangeRespondentName={setRespondentName}
          onToggleMute={handleToggleMute}
          onStart={handleStartGame}
          onDownloadStandalone={downloadStandaloneHtml}
        />
      )}

      {/* Mobile Multi-Touch Virtual Dual-Stick & Action Buttons */}
      {phase === 'playing' && !activeDialogue && controlMode === 'mobile' && (
        <MobileControls
          hud={hud}
          onJoystickMove={(x, y, autoSprint) =>
            engineRef.current?.setVirtualJoystick(x, y, autoSprint)
          }
          onTouchLook={(dx, dy) => engineRef.current?.applyTouchLook(dx, dy)}
          onSprintChange={(active) => engineRef.current?.setMobileSprint(active)}
          onInteract={() => engineRef.current?.triggerMobileInteract()}
          onLantern={() => engineRef.current?.triggerMobileLantern()}
        />
      )}

      {/* Active Gameplay HUD */}
      {phase === 'playing' && !activeDialogue && (
        <GameHUD
          hud={hud}
          muted={muted}
          controlMode={controlMode}
          onToggleControlMode={handleToggleControlMode}
          onToggleMute={handleToggleMute}
          onOpenJournal={handleOpenJournalFromHud}
          onPause={handlePauseRequested}
        />
      )}

      {/* Cinematic Typewriter Dialogue Box (Prologue, Babak I-IV, Epilogue) */}
      {activeDialogue && (phase === 'prologue' || phase === 'dialogue' || phase === 'epilogue') && (
        <DialogueBox
          lines={activeDialogue.lines}
          controlMode={controlMode}
          onTypeBlip={handleTypeBlip}
          onAudioCue={handleAudioCue}
          onLineChange={(lineIdx) => {
            if (phase === 'prologue') {
              engineRef.current?.setPrologueLineProgress(lineIdx);
            }
          }}
          onComplete={handleDialogueComplete}
        />
      )}

      {/* Unified Cinematic Cutscene Overlay (Letterbox, Fade Curtain, Subtitle, Skip) */}
      {phase === 'cutscene' && cutsceneState && (
        <div className="fixed inset-0 z-25 pointer-events-none flex flex-col justify-between">
          {/* Smooth Black Fade Transition Curtain */}
          <div
            className="fixed inset-0 bg-[#02050a] transition-opacity duration-200 pointer-events-none"
            style={{ opacity: cutsceneState.fadeOpacity }}
          />

          {/* Subtle Atmospheric Vignette */}
          {cinematicEffects && (
            <div
              className="fixed inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at center, transparent 48%, rgba(2, 6, 14, 0.72) 100%)',
              }}
            />
          )}

          {/* Top Cinema Letterbox Bar */}
          <div
            className={`relative z-10 bg-[#02050a] transition-all duration-500 ${
              cutsceneState.letterbox ? 'h-9 sm:h-14' : 'h-0'
            }`}
          />

          {/* Bottom Subtitle & Skip Bar */}
          <div className="relative z-10 mt-auto pb-5 sm:pb-6 px-4 sm:px-8 flex flex-col items-center gap-3">
            {cutsceneState.subtitle && (
              <div className="max-w-xl bg-[#04080f]/82 px-4 sm:px-6 py-3 sm:py-3.5 rounded-[2px] border border-[#78a9c4]/18 flex items-center gap-3.5">
                {(() => {
                  const cp = resolvePortraitForSpeaker(
                    cutsceneState.speaker,
                    cutsceneState.id === 'fatal_12s' ? 'kosong' : 'cemas'
                  );
                  if (!cp) return null;
                  return (
                    <div
                      className="w-12 h-14 sm:w-14 sm:h-16 shrink-0 overflow-hidden rounded-[2px] border bg-[#060c16]"
                      style={{ borderColor: `${cp.accentColor}48` }}
                    >
                      <img
                        src={cp.url}
                        alt={cp.label}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top scale-125 select-none pointer-events-none"
                      />
                    </div>
                  );
                })()}
                <div className="text-center sm:text-left flex-1 min-w-0">
                  {cutsceneState.speaker && (
                    <div className="font-ui text-[11px] tracking-[0.14em] text-[#78a9c4] mb-0.5">
                      {cutsceneState.speaker}
                    </div>
                  )}
                  <p className="font-display text-lg sm:text-xl text-[#e8eef5] italic leading-relaxed">
                    “{cutsceneState.subtitle}”
                  </p>
                </div>
              </div>
            )}

            {cutsceneState.canSkip && (
              <div className="w-full flex justify-end">
                <button
                  type="button"
                  onClick={() => engineRef.current?.skipActiveCutscene()}
                  className="pointer-events-auto min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[#78a9c4]/25 bg-[#04080f]/80 hover:border-[#d4a353]/70 text-[11px] font-ui tracking-wider text-[#8fa1b5] hover:text-[#e8eef5] rounded-[2px] transition-colors cursor-pointer"
                >
                  <FastForward className="w-3.5 h-3.5 text-[#d4a353]" />
                  <span>
                    Lewati Adegan {controlMode === 'pc' ? '· Spasi' : ''}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Cinema Letterbox Bar */}
          <div
            className={`relative z-10 bg-[#02050a] transition-all duration-500 ${
              cutsceneState.letterbox ? 'h-9 sm:h-14' : 'h-0'
            }`}
          />
        </div>
      )}

      {/* Lore Document Inspection Modal */}
      {phase === 'inspect' && activeLoreId && (
        <InspectModal
          loreId={activeLoreId}
          controlMode={controlMode}
          onClose={handleCloseOverlayModal}
        />
      )}

      {/* Environmental Puzzle Modal */}
      {phase === 'puzzle' && activePuzzleId && (
        <PuzzleModal
          puzzleId={activePuzzleId}
          controlMode={controlMode}
          discoveredClues={discoveredClues}
          onSwitchClick={(pitchOffset) => audioRef.current?.playSwitchClick(pitchOffset)}
          onSolve={handlePuzzleSolved}
          onCancel={handleCloseOverlayModal}
        />
      )}

      {/* Clue Archive Journal Modal */}
      {phase === 'journal' && (
        <JournalModal
          currentLayer={hud.layerIndex}
          controlMode={controlMode}
          discoveredClues={discoveredClues}
          solvedPuzzles={solvedPuzzles}
          onClose={handleCloseOverlayModal}
        />
      )}

      {/* Pause Modal */}
      {phase === 'paused' && (
        <PauseModal
          layerIndex={hud.layerIndex}
          controlMode={controlMode}
          muted={muted}
          cinematicEffects={cinematicEffects}
          onResume={handleResume}
          onToggleControlMode={handleToggleControlMode}
          onToggleMute={handleToggleMute}
          onToggleCinematicEffects={handleToggleCinematicEffects}
          onRestart={handleStartGame}
          onReturnToTitle={handleReturnToTitle}
        />
      )}

      {/* Psychological Mirror Interlude */}
      {phase === 'mirror' && (
        <MirrorModal
          question={MIRROR_QUESTIONS[mirrorIndex]}
          currentFrostLevel={frostLevel}
          onSelect={handleMirrorSelect}
        />
      )}

      {/* Ending & PjBL Research Recap Card */}
      {phase === 'ending' && (
        <EndingModal
          respondentName={respondentName}
          awarenessScore={awarenessScore}
          frostLevel={frostLevel}
          collectedFragments={collectedFragments}
          responses={responses}
          onRestart={handleStartGame}
          onDownloadStandalone={downloadStandaloneHtml}
        />
      )}

      {/* Checkpoint 1x Extra Retry Modal */}
      {phase === 'retry' && (
        <CheckpointRetryModal
          layerIndex={hud.layerIndex}
          collectedCount={hud.collectedCount}
          totalTargets={hud.totalTargets}
          cluesFound={hud.cluesFound}
          onRetry={handleUseCheckpointRetry}
        />
      )}

      {/* Special Game Over Screen (When Stage Retry Is Already Spent & Lives Hit 0) */}
      {phase === 'gameover' && (
        <GameOverModal
          respondentName={respondentName}
          layerIndex={hud.layerIndex}
          awarenessScore={awarenessScore}
          frostLevel={frostLevel}
          collectedFragments={collectedFragments}
          jumpscareCount={jumpscareCount}
          responses={responses}
          onRestartStage={handleRestartCurrentStage}
          onRestart={handleStartGame}
          onReturnToTitle={handleReturnToTitle}
        />
      )}
    </div>
  );
}
