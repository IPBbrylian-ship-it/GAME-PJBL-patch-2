export type GamePhase =
  | 'title'
  | 'prologue'
  | 'playing'
  | 'dialogue'
  | 'inspect'
  | 'puzzle'
  | 'journal'
  | 'paused'
  | 'retry'
  | 'mirror'
  | 'cutscene'
  | 'gameover'
  | 'epilogue'
  | 'ending';

export type LayerIndex = 0 | 1 | 2 | 3;

export type DifficultyMode = 'standard' | 'story';

export type ControlMode = 'pc' | 'mobile';

export type SurfaceType = 'snow' | 'wood' | 'tile';

export type PortraitExpr =
  | 'normal'
  | 'angry'
  | 'anxious'
  | 'crying'
  | 'fearful'
  | 'sad'
  | 'shocked'
  | 'traumatized';

export interface DialogueLine {
  speaker: string;
  emotion: string;
  text: string;
  cue?: 'clock' | 'whisper' | 'door' | 'ice' | 'chime';
  portraitExpr?: PortraitExpr;
}

export type LoreCategory = 'dokumen' | 'foto' | 'benda' | 'papan';

export interface LoreClueData {
  id: string;
  layerIndex: LayerIndex;
  category: LoreCategory;
  title: string;
  locationLabel: string;
  dateOrTag: string;
  excerpt: string;
  contextNote: string;
  clueHint?: string;
  accentColor?: string;
}

export type PuzzleKind = 'fusebox' | 'keypad' | 'terminal' | 'satgas';

export interface PuzzleConfig {
  id: string;
  layerIndex: LayerIndex;
  kind: PuzzleKind;
  title: string;
  subtitle: string;
  prompt: string;
  hint: string;
  relatedClueId: string;
  unlockTargetLabel: string;
  solutionCode?: string;
}

export interface LayerMeta {
  index: LayerIndex;
  roman: string;
  title: string;
  era: string;
  surface: SurfaceType;
  objectiveLabel: string;
  totalTargets: number;
  exitLabel: string;
  ambientHint: string;
}

export interface MirrorOption {
  id: string;
  label: string;
  sublabel: string;
  awarenessDelta: number;
  frostDelta: number;
  tag: string;
}

export interface MirrorQuestion {
  id: string;
  betweenLabel: string;
  prompt: string;
  contextNote: string;
  options: MirrorOption[];
}

export interface MirrorResponseRecord {
  questionId: string;
  betweenLabel: string;
  chosenLabel: string;
  tag: string;
  awarenessDelta: number;
}

export type StoryPhase = 'calm_before' | 'transitioning' | 'horror_after';

export interface HudSnapshot {
  layerIndex: LayerIndex;
  lives: number;
  maxLives: number;
  extraRetryAvailable: boolean;
  damageFlash: number;
  jumpscareCount: number;
  graceTimer: number;
  strobePhase: 'none' | 'red' | 'blue';
  warmth: number;
  stamina: number;
  lanternCooldown: number;
  lanternActive: boolean;
  isHiding: boolean;
  isPointerLocked: boolean;
  collectedCount: number;
  totalTargets: number;
  cluesFound: number;
  cluesTotal: number;
  solvedPuzzlesCount: number;
  totalPuzzlesCount: number;
  activeObjectiveHint: string;
  exitUnlocked: boolean;
  frostLevel: number;
  threatDistance: number;
  storyPhase: StoryPhase;
  horrorBlend: number;
  promptText: string | null;
  promptSubtext: string | null;
}

export type CutsceneId =
  | 'prologue_collapse'
  | 'babak1_stalker_reveal'
  | 'babak2_authority_reveal'
  | 'babak3_corridor_dread'
  | 'babak4_dome_intro'
  | 'babak4_liberation'
  | 'fatal_12s';

export interface CutsceneOverlayState {
  id: CutsceneId;
  speaker: string | null;
  subtitle: string | null;
  fadeOpacity: number;
  canSkip: boolean;
  letterbox: boolean;
}

export type EndingType = 'true' | 'neutral' | 'bad';

export interface EndingInfo {
  type: EndingType;
  title: string;
  subtitle: string;
  narrative: string;
  constitutionalSynthesis: string;
  accentColor: string;
  badgeText: string;
}

export interface ConstitutionalMapping {
  pillar: string;
  pancasilaRef: string;
  uudRef: string;
  explanation: string;
}

export const LAYER_METAS: LayerMeta[] = [
  {
    index: 0,
    roman: 'BABAK I',
    title: 'Rumah Lantai Dua',
    era: 'Masa Kecil · Usia 6 Tahun',
    surface: 'wood',
    objectiveLabel: 'Fragmen Memori',
    totalTargets: 2,
    exitLabel: 'Tembok Es Keheningan',
    ambientHint: 'Jelajahi lantai dua rumah kayu ini, cari 2 Fragmen Memori, lalu tembus Tembok Es di ujung lorong.',
  },
  {
    index: 1,
    roman: 'BABAK II',
    title: 'Ruang Kelas & Pintu BK',
    era: 'Masa Sekolah',
    surface: 'tile',
    objectiveLabel: 'Fragmen Memori',
    totalTargets: 2,
    exitLabel: 'Pintu Ruang BK Dirantai',
    ambientHint: 'Hindari sosok bayangan itu, kumpulkan 2 Fragmen Memori, dan lepaskan rantai di Pintu Ruang BK.',
  },
  {
    index: 2,
    roman: 'BABAK III',
    title: 'Labirin Layar & Lorong Gosip',
    era: 'Masa Remaja — Awal Kuliah',
    surface: 'tile',
    objectiveLabel: 'Fragmen & Suar',
    totalTargets: 2,
    exitLabel: 'Pintu Akhir Lorong',
    ambientHint: 'Amankan bukti pesan malam dan layar AI, lalu kejar Suar Biru Share-Loc melewati lorong ujung.',
  },
  {
    index: 3,
    roman: 'BABAK IV',
    title: 'Kubah Kaca di Sudut Kampus',
    era: 'Masa Kini & Pemulihan',
    surface: 'snow',
    objectiveLabel: 'Pilar Perlindungan',
    totalTargets: 4,
    exitLabel: 'Kubah Kaca Rindiani',
    ambientHint: 'Nyalakan 4 Pilar Perlindungan di halaman kampus untuk mencairkan es yang mengurung Rindi.',
  },
];

// Gameplay Mirror questions focus on lived student ethics & empathy (no explicit legal article numbers)
export const MIRROR_QUESTIONS: MirrorQuestion[] = [
  {
    id: 'mirror_1',
    betweenLabel: 'CERMIN PSIKOLOGIS I · ANTARA BABAK I & II',
    prompt:
      'Kalau ada anak atau korban yang bertahun-tahun memilih diam karena takut bikin keluarga besar ribut dengan orang tua pelaku, sikap apa yang seharusnya diambil orang-orang terdekatnya?',
    contextNote: 'Refleksi: Nilai Kemanusiaan & Hak Anak untuk Merasa Aman',
    options: [
      {
        id: 'm1_empathy',
        label: 'Dampingi Korban & Hentikan Budaya Diam',
        sublabel: 'Rasa aman korban jauh lebih penting daripada sekadar menjaga muka keluarga di depan orang lain.',
        awarenessDelta: 34,
        frostDelta: -0.18,
        tag: 'Berpihak pada Korban & Memutus Diam',
      },
      {
        id: 'm1_neutral',
        label: 'Selesaikan Diam-Diam Secara Kekeluargaan',
        sublabel: 'Mencari jalan tengah internal agar keluarga tidak pecah, meski tidak ada kepastian pemulihan bagi korban.',
        awarenessDelta: 16,
        frostDelta: 0.05,
        tag: 'Kompromi Sosial / Mediasi Pasif',
      },
      {
        id: 'm1_blame',
        label: 'Jaga Nama Baik Keluarga Lebih Dulu',
        sublabel: 'Sebaiknya kejadian lama disimpan sendiri saja supaya tidak memicu keributan dan rasa malu di keluarga besar.',
        awarenessDelta: 0,
        frostDelta: 0.24,
        tag: 'Normalisasi Budaya Diam',
      },
    ],
  },
  {
    id: 'mirror_2',
    betweenLabel: 'CERMIN PSIKOLOGIS II · ANTARA BABAK II & III',
    prompt:
      'Waktu pelecehan dianggap cuma "candaan anak kelas" atau malah dilakukan oknum yang punya jabatan di sekolah atau kampus, apakah poster imbauan dan seminar saja sudah cukup?',
    contextNote: 'Refleksi: Penegakan Sanksi Nyata & Tanpa Impunitas Otoritas',
    options: [
      {
        id: 'm2_justice',
        label: 'Belum Cukup — Harus Ada Ruang Lapor Aman & Sanksi Tegas',
        sublabel: 'Poster tidak ada artinya kalau pelaku yang punya kuasa tetap dibiarkan bebas dan korban justru takut melapor.',
        awarenessDelta: 33,
        frostDelta: -0.16,
        tag: 'Sanksi Tegas & Ruang Lapor Aman',
      },
      {
        id: 'm2_poster',
        label: 'Sosialisasi & Poster Sudah Cukup Sebagai Langkah Awal',
        sublabel: 'Cukup diingatkan lewat imbauan moral dan edukasi rutin tanpa perlu menjatuhkan sanksi berat.',
        awarenessDelta: 15,
        frostDelta: 0.08,
        tag: 'Pendekatan Seremonial / Poster',
      },
      {
        id: 'm2_ignore',
        label: 'Redam Diam-Diam Demi Nama Baik Sekolah atau Kampus',
        sublabel: 'Kalau dibuka ke publik, reputasi institusi ikut rusak dan citranya jadi jelek.',
        awarenessDelta: 0,
        frostDelta: 0.25,
        tag: 'Pembiaran & Impunitas Otoritas',
      },
    ],
  },
  {
    id: 'mirror_3',
    betweenLabel: 'CERMIN PSIKOLOGIS III · ANTARA BABAK III & IV',
    prompt:
      'Ketika foto rekayasa AI dan gosip jahat mulai tersebar lalu menyalahkan cara bergaul mahasiswi, sikap mana yang benar-benar membantu korban?',
    contextNote: 'Refleksi: Menolak Stigma Slut-Shaming & Melindungi Martabat Korban',
    options: [
      {
        id: 'm3_solidarity',
        label: 'Tolak Stigma, Hentikan Penyebaran & Dampingi Korban',
        sublabel: 'Manipulasi digital dan kekerasan adalah kejahatan pelaku—korban tidak pernah pantas disalahkan dan berhak dilindungi.',
        awarenessDelta: 33,
        frostDelta: -0.18,
        tag: 'Anti-Stigma & Pendampingan Aktif',
      },
      {
        id: 'm3_caution',
        label: 'Menasihati Korban Supaya Lebih Hati-Hati di Dunia Maya',
        sublabel: 'Ikut prihatin, tapi mengingatkan bahwa masalah seperti ini muncul karena kurang waspada saat berelasi.',
        awarenessDelta: 14,
        frostDelta: 0.1,
        tag: 'Bias Menyalahkan Korban Terselubung',
      },
      {
        id: 'm3_stigma',
        label: 'Anggap Gosip Itu Risiko Wajar dari Pergaulan',
        sublabel: 'Penghakiman dan omongan orang lain memang hal biasa kalau seseorang sudah jadi bahan pembicaraan.',
        awarenessDelta: 0,
        frostDelta: 0.25,
        tag: 'Reproduksi Budaya Menyalahkan Korban',
      },
    ],
  },
];

// Explicit Pancasila & UUD NRI 1945 mappings displayed ONLY at the final screen
export const CONSTITUTIONAL_MAPPINGS: ConstitutionalMapping[] = [
  {
    pillar: 'Pilar I: Keberanian Bersuara & Dukungan Lingkar Terdekat',
    pancasilaRef: 'Sila ke-2 Pancasila (Kemanusiaan yang Adil dan Beradab)',
    uudRef: 'Pasal 28G ayat (1) UUD NRI 1945',
    explanation:
      'Memanusiakan korban dan memutus budaya diam demi keutuhan semu, serta menjamin hak atas rasa aman dan perlindungan diri dari rasa takut.',
  },
  {
    pillar: 'Pilar II: Ruang Aman Kampus & Satgas PPKS Proaktif',
    pancasilaRef: 'Sila ke-5 Pancasila (Keadilan Sosial bagi Seluruh Rakyat Indonesia)',
    uudRef: 'Pasal 28I ayat (2) UUD NRI 1945',
    explanation:
      'Menghadirkan sistem pelaporan yang proaktif dan bebas dari perlakuan diskriminatif, stigma slut-shaming, maupun penghakiman di lingkungan pendidikan.',
  },
  {
    pillar: 'Pilar III: Sanksi Hukum Tegas Tanpa Kompromi',
    pancasilaRef: 'Sila ke-2 & ke-5 Pancasila',
    uudRef: 'Pasal 1 ayat (3) & Pasal 27 ayat (1) UUD NRI 1945',
    explanation:
      'Menegaskan prinsip negara hukum dan kesamaan kedudukan di muka hukum: tidak ada kekebalan bagi senior, pasangan, maupun oknum figur otoritas.',
  },
  {
    pillar: 'Pilar IV: Rehabilitasi Psikologis & Jaminan Martabat',
    pancasilaRef: 'Sila ke-2 Pancasila',
    uudRef: 'Pasal 28D ayat (1) & Pasal 28G ayat (1) UUD NRI 1945',
    explanation:
      'Menjamin kepastian hukum yang adil serta pemulihan mental dan kehormatan korban kekerasan seksual maupun KBGO berbasis AI.',
  },
];

export const ENDINGS: Record<EndingType, EndingInfo> = {
  true: {
    type: 'true',
    title: 'Mencairnya Kubah Kaca: Ruang Aman & Pemulihan Martabat',
    subtitle: 'TRUE ENDING · KESADARAN KONSTITUSIONAL TINGGI',
    badgeText: 'KUBAH ES MENCAIR SEMPURNA',
    accentColor: '#d4a353',
    narrative:
      'Keempat Pilar Perlindungan meruntuhkan kubah beku di sudut kampus. Kembali di bangku taman di bawah sinar matahari pagi, salju akhirnya berhenti turun. Rindiani menghela napas lega—kali ini ia tahu dirinya tidak sendirian, dan melangkah bersama Bima menuju gedung layanan Satgas PPKS kampus.',
    constitutionalSynthesis:
      'Pemulihan ini mencerminkan pengamalan nyata Sila ke-2 & Sila ke-5 Pancasila serta Pasal 1 ayat (3), Pasal 27 ayat (1), Pasal 28D ayat (1), Pasal 28G ayat (1), dan Pasal 28I ayat (2) UUD NRI 1945: negara hukum wajib menjamin ruang aman yang bebas dari kekerasan, stigma diskriminatif, dan impunitas pelaku.',
  },
  neutral: {
    type: 'neutral',
    title: 'Poster di Atas Retakan',
    subtitle: 'NEUTRAL ENDING · KESADARAN PARSIAL',
    badgeText: 'KUBAH HANYA RETAK SEBAGIAN',
    accentColor: '#78a9c4',
    narrative:
      'Retakan di Kubah Kaca memang melebar, tapi udara dingin belum benar-benar pergi. Di bangku taman kampus, Rindi menatap poster-poster kampanye anti-kekerasan yang tertempel di papan pengumuman. Sosialisasi terdengar ramai, namun keraguan menindak pelaku membuat langkahnya menuju ruang pelaporan kembali tertahan.',
    constitutionalSynthesis:
      'Amanat Pasal 28D ayat (1) dan Pasal 28G ayat (1) UUD NRI 1945 menuntut kepastian hukum serta perlindungan nyata—bukan sekadar poster seremonial tanpa keberanian menegakkan sanksi.',
  },
  bad: {
    type: 'bad',
    title: 'Musim Dingin Abadi',
    subtitle: 'BAD ENDING · BUDAYA PEMBIARAN',
    badgeText: 'KUBAH MEMBEKU TOTAL',
    accentColor: '#c25959',
    narrative:
      'Salju semakin deras menimbun bangku taman kampus. Rindiani kembali memeluk tasnya dalam diam, sementara sikap memaklumi, gosip menyalahkan korban, dan rasa takut melapor membuat kubah es mengunci lebih rapat dari sebelumnya.',
    constitutionalSynthesis:
      'Pembiaran terhadap kekerasan dan stigma menyalahi kemanusiaan yang adil dan beradab (Sila ke-2 Pancasila) serta hak setiap warga negara untuk bebas dari perlakuan diskriminatif dan rasa takut (Pasal 28G ayat (1) & Pasal 28I ayat (2) UUD NRI 1945).',
  },
};
