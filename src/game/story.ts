import { DialogueLine, EndingType } from '../types/game';

export const PROLOGUE_DIALOGUES: DialogueLine[] = [
  {
    speaker: 'Bima',
    emotion: 'Pelan, cemas',
    portraitExpr: 'anxious',
    text: 'Rindi... anginnya sudah sedingin ini. Kenapa masih duduk sendirian di bangku belakang gedung?',
  },
  {
    speaker: 'Rindiani',
    emotion: 'Menatap kosong, memeluk tas',
    portraitExpr: 'traumatized',
    text: 'Di kampus ini semua orang cuma anggap hal itu bahan bercanda, Bim... percuma cerita. Sekali buka suara, malah aku yang dibilang cari perhatian.',
  },
  {
    speaker: 'Bima',
    emotion: 'Tegas tapi lembut',
    portraitExpr: 'sad',
    text: 'Aku di sini bukan buat menertawakan atau menyalahkanmu, Rindi. Kamu nggak perlu menanggung semuanya sendirian terus.',
  },
  {
    speaker: 'Rindiani',
    emotion: 'Suara bergetar',
    portraitExpr: 'fearful',
    text: 'Kamu nggak akan kuat dengar semuanya... Rasanya terlalu dingin untuk diingat lagi.',
    cue: 'clock',
  },
  {
    speaker: 'Bima (Dalam Hati)',
    emotion: 'Terseret kabut beku',
    portraitExpr: 'shocked',
    text: 'Jam menara kampus berdentang berat. Udara tiba-tiba terasa membeku—taman di sekelilingku runtuh menjadi lorong ingatan Rindi yang selama ini ia kunci.',
    cue: 'ice',
  },
];

export const LAYER_INTRO_DIALOGUES: Record<number, DialogueLine[]> = {
  0: [
    {
      speaker: 'Bima',
      emotion: 'Terengah, kedinginan',
      portraitExpr: 'anxious',
      text: 'Ini lantai dua rumah kayu lama... Dari bawah tangga terdengar samar suara ramai acara syukuran keluarga, tapi di atas sini sepi dan dingin sekali.',
    },
    {
      speaker: 'Gema Memori',
      emotion: 'Samar di lorong',
      text: '“Rindi masih lemas habis DBD... biar main sebentar di kamar atas, di bawah terlalu ramai...”',
      cue: 'whisper',
    },
  ],
  1: [
    {
      speaker: 'Bima',
      emotion: 'Waspada',
      portraitExpr: 'anxious',
      text: 'Ruang kelas SD yang terasa aneh... Kenapa ada pensil raksasa berputar di tengah meja dan boneka-boneka kelas yang diam mematung?',
    },
  ],
  2: [
    {
      speaker: 'Bima',
      emotion: 'Tegang',
      portraitExpr: 'fearful',
      text: 'Dinding-dinding kaca penuh layar ponsel ungu... dan bunyi notifikasi yang terus mendesak di tengah malam.',
    },
  ],
  3: [
    {
      speaker: 'Bima',
      emotion: 'Terkejut',
      portraitExpr: 'shocked',
      text: 'Itu Rindi... terkurung di dalam kubah kaca di tengah halaman kampus bersalju. Aku harus menyalakan keempat pilar pelindung untuk mencairkan esnya.',
    },
  ],
};

export const FRAGMENT_DIALOGUES: Record<string, DialogueLine[]> = {
  // BABAK I
  frag_1_phone: [
    {
      speaker: 'Bima',
      emotion: 'Mengamati ponsel di nakas',
      portraitExpr: 'sad',
      text: 'Layar ponsel ini masih menyala dingin... Seseorang memakainya untuk membujuk anak berusia enam tahun yang sedang lemah habis sakit DBD.',
      cue: 'chime',
    },
    {
      speaker: 'Suara Rindi Kecil',
      emotion: 'Ketakutan',
      portraitExpr: 'fearful',
      text: '“Katanya cuma sebentar pinjam HP di kamar atas... tapi pintunya ditutup, dan aku nggak berani teriak karena takut dimarahi...”',
    },
  ],
  frag_1_music: [
    {
      speaker: 'Suara Ibu (Gema)',
      emotion: 'Panik memanggil dari bawah',
      text: '“Rindi! Rindi di mana, Nak?! Turun sebentar, Nak!”',
      cue: 'chime',
    },
    {
      speaker: 'Rindiani',
      emotion: 'Menahan tangis',
      portraitExpr: 'crying',
      text: 'Panggilan Ibu menyelamatkanku malam itu... Tapi sampai besar aku tetap diam. Aku takut keluarga besar ribut dan pecah gara-gara cerita itu.',
    },
  ],
  exit_1: [
    {
      speaker: 'Rindiani',
      emotion: 'Lirih di balik Tembok Es',
      portraitExpr: 'sad',
      text: 'Bertahun-tahun aku menahan semuanya supaya keluarga tidak ribut... Sampai diamku mengeras jadi tembok ini.',
      cue: 'ice',
    },
    {
      speaker: 'Bima',
      emotion: 'Tegas',
      portraitExpr: 'angry',
      text: 'Keluarga yang tampak akur di luar tidak boleh dibayar pakai luka seumur hidupmu, Rindi. Tembok ini harus hancur.',
    },
  ],

  // BABAK II
  frag_2_note: [
    {
      speaker: 'Gema Tawa Kelas',
      emotion: 'Mengejek',
      text: '“Putar lagi pensilnya! Ujungnya nunjuk siapa hari ini?! Jangan baperan ah, cuma bercanda!”',
      cue: 'whisper',
    },
    {
      speaker: 'Rindiani',
      emotion: 'Tertekan',
      portraitExpr: 'fearful',
      text: 'Mereka mengundi siswi mana yang bakal jadi sasaran sentuhan paksa. Teman-teman lain cuma diam atau ikut ketawa karena takut sama anak yang paling berkuasa di kelas.',
    },
  ],
  frag_2_badge: [
    {
      speaker: 'Gema Suara Oknum Guru',
      emotion: 'Merendahkan, berkuasa',
      text: '“Kamu manis sekali hari ini... mau tidak jadi istri bapak nanti?”',
      cue: 'whisper',
    },
    {
      speaker: 'Rindiani',
      emotion: 'Gemetar di depan Ruang BK',
      portraitExpr: 'crying',
      text: 'Sudah pernah dilaporkan, tapi dia tetap bebas mengajar. Lihat pintu Ruang BK yang dirantai itu... mau mengadu saja rasanya malah aku yang dihakimi.',
    },
  ],
  exit_2: [
    {
      speaker: 'Bima',
      emotion: 'Mematahkan rantai',
      portraitExpr: 'angry',
      text: 'Rantai ini ada karena sekolah membiarkan pelaku berkuasa tanpa hukuman. Ruang mengadu tidak boleh dikunci dari korban.',
      cue: 'door',
    },
  ],

  // BABAK III
  frag_3_kbgo: [
    {
      speaker: 'Layar Pesan Malam',
      emotion: 'Memaksa',
      text: '“Kalau sayang buktiin sekarang. Kirim PAP bagian itu. Jangan sok suci.”',
      cue: 'whisper',
    },
    {
      speaker: 'Bima',
      emotion: 'Terkejut, marah',
      portraitExpr: 'angry',
      text: 'Gila... di layar ini ada foto wajah Rindi yang diedit tanpa busana pakai AI lalu disebar di internet. Ini kejahatan digital nyata!',
    },
  ],
  frag_3_shareloc: [
    {
      speaker: 'Rindiani',
      emotion: 'Terengah, panik',
      portraitExpr: 'fearful',
      text: 'Lengan dan bahuku dicengkeram keras sampai memar tiap kali aku menolak... Untung aku sempat diam-diam kirim share-loc ke teman dekatku.',
      cue: 'chime',
    },
    {
      speaker: 'Bima',
      emotion: 'Mantap',
      portraitExpr: 'normal',
      text: 'Suar biru itu jalan keluarnya. Jangan dengarkan bisikan fitnah di lorong depan!',
    },
  ],
  exit_3: [
    {
      speaker: 'Bisikan Fitnah',
      emotion: 'Mencemooh',
      text: '“Katanya anak rumahan yang diawasi ketat, kok gonta-ganti pacar? Salah sendiri gampang percaya...”',
      cue: 'whisper',
    },
    {
      speaker: 'Rindiani',
      emotion: 'Pedih',
      portraitExpr: 'crying',
      text: 'Padahal aku selalu diawasi ketat orang tuaku... Kenapa selalu aku yang harus menanggung malu dari kebohongan dan kekerasan mereka?',
    },
  ],

  // BABAK IV (4 Pillars)
  pillar_1: [
    {
      speaker: 'Bima',
      emotion: 'Hangat, meyakinkan',
      portraitExpr: 'normal',
      text: 'Pilar pertama menyala! Orang-orang terdekat harus mau mendengar tanpa menyalahkan. Kamu berhak bicara, Rindi.',
      cue: 'chime',
    },
    {
      speaker: 'Rindiani',
      emotion: 'Mulai tergerak',
      portraitExpr: 'sad',
      text: 'Ternyata masih ada yang mau dengar ceritaku tanpa menganggapnya bahan lelucon...',
    },
  ],
  pillar_2: [
    {
      speaker: 'Bima',
      emotion: 'Serius',
      portraitExpr: 'normal',
      text: 'Pilar kedua aktif! Kampus nggak boleh pasif—layanan pelaporan dan Satgas PPKS harus aktif melindungi mahasiswa, bukan cuma pajang poster.',
      cue: 'chime',
    },
    {
      speaker: 'Rindiani',
      emotion: 'Berharap',
      portraitExpr: 'anxious',
      text: 'Andai sejak sekolah dulu ada pintu yang benar-benar aman buat mengadu tanpa dihakimi...',
    },
  ],
  pillar_3: [
    {
      speaker: 'Bima',
      emotion: 'Tegas tanpa kompromi',
      portraitExpr: 'angry',
      text: 'Pilar ketiga menyala! Edukasi saja nggak akan mempan kalau pelaku—apa pun jabatannya atau sesenior apa pun dia—tetap kebal sanksi.',
      cue: 'chime',
    },
    {
      speaker: 'Rindiani',
      emotion: 'Mulai tegar',
      portraitExpr: 'normal',
      text: 'Cuma sanksi tegas yang bisa menghentikan pelaku supaya tidak ada korban berikutnya.',
    },
  ],
  pillar_4: [
    {
      speaker: 'Bima',
      emotion: 'Penuh empati',
      portraitExpr: 'normal',
      text: 'Pilar keempat aktif! Pemulihan psikologis, privasi yang terjaga, dan pemulihan nama baikmu bukan sekadar belas kasihan—itu hakmu.',
      cue: 'ice',
    },
    {
      speaker: 'Rindiani',
      emotion: 'Lega, suara jernih',
      portraitExpr: 'normal',
      text: 'Es di sekeliling kubah ini retak... Aku tidak lagi merasa kotor atau bersalah atas kejahatan yang bukan salahku.',
    },
  ],
};

export const TRIGGER_DIALOGUES: Record<string, DialogueLine[]> = {
  stair_warmth: [
    {
      speaker: 'Bima',
      emotion: 'Menatap ke bawah tangga',
      portraitExpr: 'sad',
      text: 'Cahaya hangat dari ruang keluarga di bawah... Semua tertawa merayakan syukuran, tanpa sadar ada sesuatu yang salah sedang terjadi di lantai atas.',
    },
  ],
  bk_hallway: [
    {
      speaker: 'Rindiani',
      emotion: 'Berbisik takut',
      portraitExpr: 'fearful',
      text: 'Sepanjang lorong ini rasanya semua mata ikut menghakimi. Pintu Ruang BK itu bahkan dirantai... ke mana lagi seorang siswi harus minta tolong?',
      cue: 'door',
    },
  ],
  slam_house: [
    {
      speaker: 'Rindiani',
      emotion: 'Tersentak kaget',
      portraitExpr: 'shocked',
      text: 'Pintunya membanting keras! Dia selalu mengunci pintu tiap kali marah, lalu mencengkeram bahuku sampai biru...',
      cue: 'door',
    },
  ],
  whisper_corridor: [
    {
      speaker: 'Bisikan Lorong',
      emotion: 'Bertubi-tubi',
      text: '“Salah sendiri... cuma bercanda... jangan dibesar-besarkan...”',
      cue: 'whisper',
    },
    {
      speaker: 'Bima',
      emotion: 'Menjaga fokus',
      portraitExpr: 'angry',
      text: 'Jangan dengarkan fitnah itu. Ikuti cahaya suar biru di ujung lorong!',
    },
  ],
};

export const PUZZLE_LOCKED_DIALOGUES: Record<string, DialogueLine[]> = {
  puzzle_1_fusebox: [
    {
      speaker: 'Bima',
      emotion: 'Mengamati kotak musik beku',
      portraitExpr: 'anxious',
      text: 'Kotak musik di meja ini mati listrik. Aku harus menyalakan dayanya lewat Panel Sekring di Gudang Timur—catatan posisi saklarnya pasti ada di Kamar Tidur Barat.',
    },
  ],
  puzzle_2_archive: [
    {
      speaker: 'Bima',
      emotion: 'Menarik brankas arsip',
      portraitExpr: 'anxious',
      text: 'Berkas laporan ini dikunci kode 3 digit di dalam brankas! Penjaga sekolah biasanya mencatat nomor loker arsip di Buku Piket Ruang Alat Timur.',
    },
  ],
  puzzle_3_terminal: [
    {
      speaker: 'Bima',
      emotion: 'Memeriksa pemancar suar',
      portraitExpr: 'anxious',
      text: 'Pemancar Suar Biru terblokir kunci sinkronisasi 3 digit. Aku harus cek jam pengiriman di salinan pesan ancaman yang ada di Kamar Pesan Malam (sisi barat).',
    },
  ],
  puzzle_4_satgas: [
    {
      speaker: 'Bima',
      emotion: 'Menatap kubah es bergetar',
      portraitExpr: 'anxious',
      text: 'Angin es di sekitar kubah masih terlalu kuat! Aku harus mengaktifkan Terminal Protokol Satgas PPKS di Plaza Utara sesuai urutan pada papan pengumuman di sisi Tenggara.',
    },
  ],
};

export const PUZZLE_SOLVED_DIALOGUES: Record<string, DialogueLine[]> = {
  puzzle_1_fusebox: [
    {
      speaker: 'Bima',
      emotion: 'Lega, waspada',
      portraitExpr: 'normal',
      text: 'Listrik lantai atas nyala lagi! Lampu di Ruang Musik Barat Laut sudah menyala—Kotak Musik Panggilan Ibu bisa kuperiksa sekarang.',
      cue: 'chime',
    },
  ],
  puzzle_2_archive: [
    {
      speaker: 'Bima',
      emotion: 'Serius, geram',
      portraitExpr: 'angry',
      text: 'Brankas terbuka. Berkas laporan sekolah yang sengaja disembunyikan di Ruang Arsip ini akhirnya bisa kuambil.',
      cue: 'chime',
    },
  ],
  puzzle_3_terminal: [
    {
      speaker: 'Bima',
      emotion: 'Mantap',
      portraitExpr: 'normal',
      text: 'Sinkronisasi berhasil! Sinyal Share-Loc Penyelamatan di Ruang Suar Timur sekarang menyala terang menembus kabut.',
      cue: 'chime',
    },
  ],
  puzzle_4_satgas: [
    {
      speaker: 'Bima',
      emotion: 'Tegas, penuh harap',
      portraitExpr: 'normal',
      text: 'Protokol Dengar–Lindungi–Tindak–Pulihkan aktif! Gelombang hangat mulai meredam badai es di sekeliling Kubah Kaca Rindi.',
      cue: 'chime',
    },
  ],
};

export function getEpilogueDialogues(endingType: EndingType): DialogueLine[] {
  if (endingType === 'true') {
    return [
      {
        speaker: 'Bima (Dalam Hati)',
        emotion: 'Hangat di pagi hari',
        portraitExpr: 'normal',
        text: 'Kabut beku pelan-pelan menghilang. Salju berhenti turun di sudut taman kampus, digantikan matahari pagi yang hangat di antara pepohonan.',
      },
      {
        speaker: 'Rindiani',
        emotion: 'Tersenyum tipis, tegar',
        portraitExpr: 'normal',
        text: 'Makasih ya sudah nggak berhenti dengerin aku, Bim. Hari ini aku siap melapor dan menata ulang hidupku.',
      },
      {
        speaker: 'Bima',
        emotion: 'Mendampingi',
        portraitExpr: 'normal',
        text: 'Ayo, kantor layanan Satgas PPKS sudah buka. Aku temani dari awal sampai selesai.',
      },
    ];
  }

  if (endingType === 'neutral') {
    return [
      {
        speaker: 'Bima (Dalam Hati)',
        emotion: 'Sendu di bawah langit mendung',
        portraitExpr: 'sad',
        text: 'Salju memang menipis, tapi udara di bangku taman tetap dingin. Di papan pengumuman kampus, poster anti-kekerasan berkibar pelan tanpa tindakan nyata di baliknya.',
      },
      {
        speaker: 'Rindiani',
        emotion: 'Ragu menatap gedung fakultas',
        portraitExpr: 'sad',
        text: 'Banyak yang bicara soal kesadaran, Bim... tapi aku masih ragu apa pelakunya bakal benar-benar ditindak kalau aku melapor hari ini.',
      },
    ];
  }

  return [
    {
      speaker: 'Bima (Dalam Hati)',
      emotion: 'Kelam, membeku',
      portraitExpr: 'crying',
      text: 'Salju turun makin deras menutupi cahaya lampu taman. Bangku ini kembali sepi dan membeku seperti semula.',
      cue: 'ice',
    },
    {
      speaker: 'Rindiani',
      emotion: 'Membisu, memeluk tas erat',
      portraitExpr: 'traumatized',
      text: 'Sudah kubilang, Bim... terlalu banyak orang yang menutup mata. Lebih aman kalau aku tetap diam saja.',
    },
  ];
}

export const CUTSCENE_FATAL_LINE =
  'Maaf, Bim... dingin sekali... aku sudah nggak sanggup percaya siapa-siapa lagi...';

