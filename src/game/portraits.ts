import { DialogueLine } from '../types/game';

export type PortraitCharacter = 'bima' | 'rindi';

export type PortraitExpression =
  | 'normal'
  | 'angry'
  | 'anxious'
  | 'crying'
  | 'fearful'
  | 'sad'
  | 'shocked'
  | 'traumatized';

export interface ResolvedPortrait {
  character: PortraitCharacter;
  expression: PortraitExpression;
  url: string;
  label: string;
  accentColor: string;
}

export const BIMA_PORTRAITS: Record<Exclude<PortraitExpression, 'traumatized'>, string> = {
  normal: '/assets/aistudio/bima_normal_52bc1176.png',
  angry: '/assets/aistudio/bima_angry_a674d397.png',
  anxious: '/assets/aistudio/bima_anxious_7b25f138.png',
  crying: '/assets/aistudio/bima_crying_dace1dfd.png',
  fearful: '/assets/aistudio/bima_fearful_f170543b.png',
  sad: '/assets/aistudio/bima_sad_d4722e5c.png',
  shocked: '/assets/aistudio/bima_shocked_fc0b3f98.png',
};

export const RINDI_PORTRAITS: Record<PortraitExpression, string> = {
  normal: '/assets/aistudio/rindi_normal_700fac5f.png',
  angry: '/assets/aistudio/rindi_angry_856be5f9.png',
  anxious: '/assets/aistudio/rindi_anxionus_3f49901b.png',
  crying: '/assets/aistudio/rindi_crying_c40a913a.png',
  fearful: '/assets/aistudio/rindi_fearful_bb7377be.png',
  sad: '/assets/aistudio/rindi_sad_b7555353.png',
  shocked: '/assets/aistudio/rindi_shocked_edc43a01.png',
  traumatized: '/assets/aistudio/traumatized_801391f9.png',
};

let preloaded = false;

export function preloadPortraits(): void {
  if (preloaded || typeof Image === 'undefined') return;
  preloaded = true;
  const urls = [
    ...Object.values(BIMA_PORTRAITS),
    ...Object.values(RINDI_PORTRAITS),
  ];
  urls.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

export function getPortraitUrl(
  character: PortraitCharacter,
  expression: PortraitExpression
): string {
  if (character === 'bima') {
    const safeExpr: Exclude<PortraitExpression, 'traumatized'> =
      expression === 'traumatized' ? 'shocked' : expression;
    return BIMA_PORTRAITS[safeExpr];
  }
  return RINDI_PORTRAITS[expression];
}

function inferExpressionFromEmotion(emotion: string, character: PortraitCharacter): PortraitExpression {
  const e = emotion.toLowerCase();
  if (character === 'rindi' && (e.includes('kosong') || e.includes('membisu') || e.includes('trauma') || e.includes('beku'))) {
    return 'traumatized';
  }
  if (e.includes('tangis') || e.includes('menangis') || e.includes('pedih')) {
    return 'crying';
  }
  if (e.includes('marah') || e.includes('kompromi') || e.includes('mematahkan') || e.includes('tegar')) {
    return e.includes('tegar') || e.includes('tersenyum') ? 'normal' : 'angry';
  }
  if (e.includes('terkejut') || e.includes('tersentak') || e.includes('kaget')) {
    return 'shocked';
  }
  if (e.includes('takut') || e.includes('panik') || e.includes('gemetar') || e.includes('terseret')) {
    return 'fearful';
  }
  if (e.includes('sedih') || e.includes('sendu') || e.includes('ragu') || e.includes('lirih') || e.includes('tertekan')) {
    return 'sad';
  }
  if (e.includes('cemas') || e.includes('tegang') || e.includes('waspada') || e.includes('terengah') || e.includes('dingin') || e.includes('fokus') || e.includes('berbisik')) {
    return 'anxious';
  }
  if (e.includes('lega') || e.includes('hangat') || e.includes('jernih') || e.includes('mantap') || e.includes('mendampingi') || e.includes('berharap') || e.includes('tergerak')) {
    return 'normal';
  }
  return 'normal';
}

export function resolvePortraitForSpeaker(
  speaker: string | null,
  emotion?: string,
  explicitExpr?: PortraitExpression
): ResolvedPortrait | null {
  if (!speaker) return null;
  const s = speaker.toLowerCase();

  // Ambient echoes, system screens, or antagonist voices stay text-only without protagonist bust portraits
  if (
    s.includes('gema') ||
    s.includes('bisikan') ||
    s.includes('layar') ||
    s.includes('suara ibu') ||
    s.includes('bayangan')
  ) {
    return null;
  }

  let character: PortraitCharacter | null = null;
  let label = speaker;
  if (s.includes('rindi')) {
    character = 'rindi';
    label = s.includes('kecil') ? 'Rindiani (Memori)' : 'Rindiani';
  } else if (s.includes('bima')) {
    character = 'bima';
    label = 'Bima';
  }

  if (!character) return null;

  const expression = explicitExpr ?? inferExpressionFromEmotion(emotion ?? '', character);
  return {
    character,
    expression,
    url: getPortraitUrl(character, expression),
    label,
    accentColor: character === 'bima' ? '#d4a353' : '#78a9c4',
  };
}

export function resolveDialoguePortrait(line: DialogueLine | undefined): ResolvedPortrait | null {
  if (!line) return null;
  return resolvePortraitForSpeaker(line.speaker, line.emotion, line.portraitExpr);
}
