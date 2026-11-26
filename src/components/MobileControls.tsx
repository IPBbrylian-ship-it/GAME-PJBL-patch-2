import React, { useEffect, useRef, useState } from 'react';
import { EyeOff, Flame, Footprints, Hand } from 'lucide-react';
import { HudSnapshot } from '../types/game';

interface MobileControlsProps {
  hud: HudSnapshot;
  onJoystickMove: (x: number, y: number, autoSprint: boolean) => void;
  onTouchLook: (dx: number, dy: number) => void;
  onSprintChange: (active: boolean) => void;
  onInteract: () => void;
  onLantern: () => void;
}

const STICK_RADIUS = 54;
const AUTO_SPRINT_THRESHOLD = 0.85;
const RING_RADIUS = 24;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const MobileControls: React.FC<MobileControlsProps> = ({
  hud,
  onJoystickMove,
  onTouchLook,
  onSprintChange,
  onInteract,
  onLantern,
}) => {
  const stickZoneRef = useRef<HTMLDivElement | null>(null);
  const stickBaseRef = useRef<HTMLDivElement | null>(null);
  const camZoneRef = useRef<HTMLDivElement | null>(null);

  const leftTouchIdRef = useRef<number | null>(null);
  const camTouchIdRef = useRef<number | null>(null);
  const camLastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [autoSprintActive, setAutoSprintActive] = useState(false);
  const [sprintToggled, setSprintToggled] = useState(false);

  const callbacksRef = useRef({
    onJoystickMove,
    onTouchLook,
    onSprintChange,
    onInteract,
    onLantern,
  });
  callbacksRef.current = {
    onJoystickMove,
    onTouchLook,
    onSprintChange,
    onInteract,
    onLantern,
  };

  useEffect(() => {
    const zone = stickZoneRef.current;
    const base = stickBaseRef.current;
    if (!zone || !base) return;

    const updateFromTouch = (touch: Touch) => {
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rawDx = touch.clientX - cx;
      const rawDy = touch.clientY - cy;
      const dist = Math.hypot(rawDx, rawDy);
      const clampedDist = Math.min(STICK_RADIUS, dist);
      const angle = Math.atan2(rawDy, rawDx);

      const kx = dist > 0.001 ? Math.cos(angle) * clampedDist : 0;
      const ky = dist > 0.001 ? Math.sin(angle) * clampedDist : 0;
      const normX = kx / STICK_RADIUS;
      const normY = -ky / STICK_RADIUS;
      const ratio = clampedDist / STICK_RADIUS;
      const autoSprint = ratio > AUTO_SPRINT_THRESHOLD;

      setKnobOffset({ x: kx, y: ky });
      setAutoSprintActive(autoSprint);
      callbacksRef.current.onJoystickMove(normX, normY, autoSprint);
    };

    const resetStick = () => {
      leftTouchIdRef.current = null;
      setKnobOffset({ x: 0, y: 0 });
      setAutoSprintActive(false);
      callbacksRef.current.onJoystickMove(0, 0, false);
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (leftTouchIdRef.current !== null) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      leftTouchIdRef.current = touch.identifier;
      updateFromTouch(touch);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (leftTouchIdRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === leftTouchIdRef.current) {
          e.preventDefault();
          e.stopPropagation();
          updateFromTouch(t);
          break;
        }
      }
    };

    const onTouchEndOrCancel = (e: TouchEvent) => {
      if (leftTouchIdRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === leftTouchIdRef.current) {
          e.preventDefault();
          e.stopPropagation();
          resetStick();
          break;
        }
      }
    };

    zone.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEndOrCancel, { passive: false });
    window.addEventListener('touchcancel', onTouchEndOrCancel, { passive: false });

    return () => {
      zone.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEndOrCancel);
      window.removeEventListener('touchcancel', onTouchEndOrCancel);
      resetStick();
    };
  }, []);

  useEffect(() => {
    const camZone = camZoneRef.current;
    if (!camZone) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (camTouchIdRef.current !== null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier !== leftTouchIdRef.current) {
          camTouchIdRef.current = t.identifier;
          camLastPosRef.current = { x: t.clientX, y: t.clientY };
          break;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (camTouchIdRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === camTouchIdRef.current) {
          e.preventDefault();
          const dx = t.clientX - camLastPosRef.current.x;
          const dy = t.clientY - camLastPosRef.current.y;
          camLastPosRef.current = { x: t.clientX, y: t.clientY };
          callbacksRef.current.onTouchLook(dx, dy);
          break;
        }
      }
    };

    const onTouchEndOrCancel = (e: TouchEvent) => {
      if (camTouchIdRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === camTouchIdRef.current) {
          e.preventDefault();
          camTouchIdRef.current = null;
          break;
        }
      }
    };

    camZone.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEndOrCancel, { passive: false });
    window.addEventListener('touchcancel', onTouchEndOrCancel, { passive: false });

    return () => {
      camZone.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEndOrCancel);
      window.removeEventListener('touchcancel', onTouchEndOrCancel);
    };
  }, []);

  const hasNearbyAction = Boolean(hud.promptText);
  const lanternReady = hud.lanternCooldown <= 0.01 && !hud.isHiding;
  const lanternProgress = Math.max(0, Math.min(1, 1 - hud.lanternCooldown));
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - lanternProgress);

  const handleToggleSprint = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    if ('touches' in e) e.preventDefault();
    setSprintToggled((prev) => {
      const next = !prev;
      callbacksRef.current.onSprintChange(next);
      return next;
    });
  };

  const handleInteractTap = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    if ('touches' in e) e.preventDefault();
    callbacksRef.current.onInteract();
  };

  const handleLanternTap = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    if ('touches' in e) e.preventDefault();
    callbacksRef.current.onLantern();
  };

  const sprintingVisual = sprintToggled || autoSprintActive;

  return (
    <div className="fixed inset-0 z-[12] pointer-events-none select-none overflow-hidden">
      {/* Touch Camera Look Zone */}
      <div
        ref={camZoneRef}
        aria-label="Touch Camera Look Zone"
        className="absolute inset-0 pointer-events-auto"
        style={{ touchAction: 'none' }}
      />

      {/* Bottom-Left: Minimal Virtual Analog Stick */}
      <div
        ref={stickZoneRef}
        className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 w-[140px] h-[140px] flex items-center justify-center pointer-events-auto"
        style={{ touchAction: 'none' }}
      >
        <div
          ref={stickBaseRef}
          className="relative w-[108px] h-[108px] rounded-full border backdrop-blur-xs transition-colors duration-150 flex items-center justify-center"
          style={{
            borderColor: autoSprintActive
              ? 'rgba(212, 163, 83, 0.75)'
              : 'rgba(120, 169, 196, 0.28)',
            backgroundColor: 'rgba(4, 8, 15, 0.36)',
          }}
        >
          <div
            className="w-11 h-11 rounded-full border pointer-events-none transition-colors duration-100 flex items-center justify-center"
            style={{
              transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
              borderColor: autoSprintActive ? '#d4a353' : 'rgba(120, 169, 196, 0.65)',
              backgroundColor: autoSprintActive
                ? 'rgba(212, 163, 83, 0.24)'
                : 'rgba(10, 18, 30, 0.68)',
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: autoSprintActive ? '#d4a353' : 'rgba(232, 238, 245, 0.5)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom-Right: Minimal Action Cluster */}
      <div
        className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-end gap-2.5 pointer-events-auto"
        style={{ touchAction: 'none' }}
      >
        <button
          type="button"
          onTouchStart={handleToggleSprint}
          onClick={(e) => e.stopPropagation()}
          aria-label="Lari / Sprint"
          className="min-w-[48px] min-h-[48px] w-[48px] h-[48px] rounded-full border backdrop-blur-xs flex flex-col items-center justify-center gap-0.5 transition-transform active:scale-95 cursor-pointer"
          style={{
            borderColor: sprintingVisual ? '#d4a353' : 'rgba(120, 169, 196, 0.28)',
            backgroundColor: sprintingVisual ? 'rgba(212, 163, 83, 0.2)' : 'rgba(4, 8, 15, 0.56)',
            color: sprintingVisual ? '#d4a353' : '#8fa1b5',
          }}
        >
          <Footprints className="w-3.5 h-3.5" />
          <span className="font-tech text-[8.5px] tracking-wider leading-none">LARI</span>
        </button>

        <button
          type="button"
          onTouchStart={handleLanternTap}
          onClick={(e) => e.stopPropagation()}
          aria-label="Lentera Pembeku Bayangan"
          className="relative min-w-[56px] min-h-[56px] w-[56px] h-[56px] rounded-full backdrop-blur-xs flex flex-col items-center justify-center gap-0.5 transition-transform active:scale-95 cursor-pointer"
          style={{
            backgroundColor: lanternReady ? 'rgba(20, 16, 8, 0.68)' : 'rgba(4, 8, 15, 0.56)',
            color: lanternReady ? '#d4a353' : '#8fa1b5',
            boxShadow: lanternReady ? '0 0 12px rgba(212, 163, 83, 0.25)' : 'none',
          }}
        >
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
            viewBox="0 0 56 56"
          >
            <circle
              cx="28"
              cy="28"
              r={RING_RADIUS}
              fill="none"
              stroke="rgba(120, 169, 196, 0.2)"
              strokeWidth="2"
            />
            <circle
              cx="28"
              cy="28"
              r={RING_RADIUS}
              fill="none"
              stroke={lanternReady ? '#d4a353' : '#78a9c4'}
              strokeWidth="2.2"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <Flame className="w-3.5 h-3.5 relative z-10" />
          <span className="font-tech text-[8px] tracking-wider leading-none relative z-10">
            LENTERA
          </span>
        </button>

        <button
          type="button"
          onTouchStart={handleInteractTap}
          onClick={(e) => e.stopPropagation()}
          aria-label="Interaksi atau Sembunyi"
          className="min-w-[62px] min-h-[62px] w-[62px] h-[62px] rounded-full border backdrop-blur-xs flex flex-col items-center justify-center gap-1 transition-transform active:scale-95 cursor-pointer"
          style={{
            borderColor:
              hasNearbyAction || hud.isHiding ? '#d4a353' : 'rgba(120, 169, 196, 0.3)',
            backgroundColor:
              hasNearbyAction || hud.isHiding ? 'rgba(212, 163, 83, 0.22)' : 'rgba(4, 8, 15, 0.58)',
            color: hasNearbyAction || hud.isHiding ? '#e8eef5' : '#8fa1b5',
            boxShadow:
              hasNearbyAction || hud.isHiding ? '0 0 14px rgba(212, 163, 83, 0.35)' : 'none',
          }}
        >
          {hud.isHiding ? <EyeOff className="w-4 h-4" /> : <Hand className="w-4 h-4" />}
          <span className="font-tech text-[9px] font-medium tracking-wider leading-none">
            {hud.isHiding ? 'KELUAR' : 'AKSI'}
          </span>
        </button>
      </div>
    </div>
  );
};
