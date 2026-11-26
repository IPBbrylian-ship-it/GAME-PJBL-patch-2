import * as THREE from 'three';
import { CutsceneId } from '../types/game';

export type CutsceneAudioCue =
  | 'clock'
  | 'whisper'
  | 'door'
  | 'chain'
  | 'ice'
  | 'chime'
  | 'finalChord'
  | 'shatter';

export interface CutsceneSubtitleBeat {
  start: number;
  end: number;
  speaker: string;
  text: string;
}

export interface CutsceneAudioBeat {
  at: number;
  cue: CutsceneAudioCue;
}

export interface CutsceneMetadata {
  id: CutsceneId;
  duration: number;
  skipLockSeconds: number;
  subtitles: CutsceneSubtitleBeat[];
  audioCues: CutsceneAudioBeat[];
}

export function easeInOutSine(t: number): number {
  const c = THREE.MathUtils.clamp(t, 0, 1);
  return -(Math.cos(Math.PI * c) - 1) / 2;
}

export function easeOutCubic(t: number): number {
  const c = THREE.MathUtils.clamp(t, 0, 1);
  return 1 - Math.pow(1 - c, 3);
}

export function easeInOutCubic(t: number): number {
  const c = THREE.MathUtils.clamp(t, 0, 1);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

export const CUTSCENE_CATALOG: Record<CutsceneId, CutsceneMetadata> = {
  prologue_collapse: {
    id: 'prologue_collapse',
    duration: 5.2,
    skipLockSeconds: 0.45,
    subtitles: [
      {
        start: 0.3,
        end: 2.35,
        speaker: 'Bima',
        text: 'Dingin ini bukan datang dari salju... rasanya datang dari semua hal yang selama ini dipendam sendirian.',
      },
      {
        start: 2.95,
        end: 5.0,
        speaker: 'Bima',
        text: 'Di lantai atas rumah masa kecil ini, suara hangat dari bawah terasa jauh dan membeku di balik pintu.',
      },
    ],
    audioCues: [
      { at: 0.25, cue: 'clock' },
      { at: 1.5, cue: 'whisper' },
      { at: 2.55, cue: 'ice' },
    ],
  },

  babak1_stalker_reveal: {
    id: 'babak1_stalker_reveal',
    duration: 5.4,
    skipLockSeconds: 0.5,
    subtitles: [
      {
        start: 1.0,
        end: 4.5,
        speaker: 'Bima',
        text: 'Jangan bergerak... ada bayangan berdiri di ujung lorong. Wajahnya tertutup topeng porselen tanpa mulut.',
      },
    ],
    audioCues: [
      { at: 1.35, cue: 'whisper' },
      { at: 2.75, cue: 'clock' },
    ],
  },

  babak2_authority_reveal: {
    id: 'babak2_authority_reveal',
    duration: 5.2,
    skipLockSeconds: 0.5,
    subtitles: [
      {
        start: 0.85,
        end: 4.4,
        speaker: 'Bima',
        text: 'Rantai pintu Ruang BK bergetar... sosok tinggi itu menghalangi lorong supaya nggak ada yang berani melapor.',
      },
    ],
    audioCues: [
      { at: 0.9, cue: 'chain' },
      { at: 2.3, cue: 'whisper' },
    ],
  },

  babak3_corridor_dread: {
    id: 'babak3_corridor_dread',
    duration: 4.8,
    skipLockSeconds: 0.5,
    subtitles: [
      {
        start: 0.75,
        end: 4.2,
        speaker: 'Bima',
        text: 'Pintunya sempat membanting keras di belakang kita—tapi masih bisa dibuka lagi. Ayo terus kejar Suar Biru di ujung lorong.',
      },
    ],
    audioCues: [
      { at: 0.2, cue: 'door' },
      { at: 1.65, cue: 'whisper' },
    ],
  },

  babak4_dome_intro: {
    id: 'babak4_dome_intro',
    duration: 5.4,
    skipLockSeconds: 0.5,
    subtitles: [
      {
        start: 0.45,
        end: 4.6,
        speaker: 'Bima',
        text: 'Rindi... Kubah Kaca itu menguncinya di tengah badai. Aku harus menyalakan keempat Pilar Perlindungan.',
      },
    ],
    audioCues: [
      { at: 0.35, cue: 'clock' },
      { at: 2.6, cue: 'chime' },
    ],
  },

  babak4_liberation: {
    id: 'babak4_liberation',
    duration: 4.4,
    skipLockSeconds: 0.5,
    subtitles: [
      {
        start: 0.35,
        end: 3.6,
        speaker: 'Rindiani',
        text: 'Cahaya pilar ini hangat sekali, Bima... es di sekelilingku mulai retak dan mencair.',
      },
    ],
    audioCues: [
      { at: 0.2, cue: 'ice' },
      { at: 1.4, cue: 'chime' },
      { at: 2.4, cue: 'finalChord' },
    ],
  },

  fatal_12s: {
    id: 'fatal_12s',
    duration: 12.0,
    skipLockSeconds: 1.6,
    subtitles: [
      {
        start: 6.0,
        end: 9.0,
        speaker: 'Rindiani · Suara Melemah',
        text: 'Nggak apa-apa... mungkin memang seharusnya aku diam saja.',
      },
    ],
    audioCues: [
      { at: 3.05, cue: 'shatter' },
      { at: 9.05, cue: 'finalChord' },
    ],
  },
};

export function sampleCutsceneFade(id: CutsceneId, t: number, duration: number): number {
  if (id === 'prologue_collapse') {
    // Fade to black at 2.15..2.65 then fade back in 2.65..3.35
    if (t >= 2.1 && t <= 2.65) {
      return easeInOutSine((t - 2.1) / 0.55);
    }
    if (t > 2.65 && t <= 3.45) {
      return 1 - easeOutCubic((t - 2.65) / 0.8);
    }
    return 0;
  }

  if (id === 'babak4_liberation') {
    if (t >= 3.25) {
      return easeInOutSine((t - 3.25) / Math.max(0.4, duration - 3.25));
    }
    if (t < 0.45) {
      return 0.45 * (1 - easeOutCubic(t / 0.45));
    }
    return 0;
  }

  if (id === 'fatal_12s') {
    if (t >= 11.1) {
      return easeInOutSine((t - 11.1) / 0.9);
    }
    return 0;
  }

  // Gentle intro/outro vignette dip for seamless gameplay transitions
  if (t < 0.35) {
    return 0.35 * (1 - easeOutCubic(t / 0.35));
  }
  if (t > duration - 0.35) {
    return 0.35 * easeInOutSine((t - (duration - 0.35)) / 0.35);
  }
  return 0;
}

export function sampleCutsceneSubtitle(
  meta: CutsceneMetadata,
  t: number
): { speaker: string | null; text: string | null } {
  for (let i = 0; i < meta.subtitles.length; i++) {
    const s = meta.subtitles[i];
    if (t >= s.start && t <= s.end) {
      return { speaker: s.speaker, text: s.text };
    }
  }
  return { speaker: null, text: null };
}
