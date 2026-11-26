import { LoreClueData, PuzzleConfig } from '../types/game';

export const LORE_CLUES: Record<string, LoreClueData> = {
  // =========================================================================
  // BABAK I: Rumah Lantai Dua yang Membeku
  // =========================================================================
  clue_1_photo: {
    id: 'clue_1_photo',
    layerIndex: 0,
    category: 'foto',
    title: 'Foto Acara Syukuran Keluarga',
    locationLabel: 'Aula Tangga Lantai Dua',
    dateOrTag: 'ARSIP RUMAH · LANTAI BAWAH',
    excerpt:
      'Sebuah bingkai foto keluarga tergeletak miring di dekat pagar tangga. Di lantai bawah, belasan kerabat tersenyum hangat di acara syukuran—sementara sudut bingkai atasnya retak beku, menyisakan bayangan pintu kamar yang tertutup rapat.',
    contextNote:
      'Dari ruang tamu semuanya terlihat hangat dan penuh tawa. Tidak ada satu pun yang curiga bahwa di atas kepala mereka, seorang anak kecil sedang ketakutan.',
    accentColor: '#d4a353',
  },
  clue_1_calendar: {
    id: 'clue_1_calendar',
    layerIndex: 0,
    category: 'dokumen',
    title: 'Kalender Pemulihan DBD & Catatan Sekring',
    locationLabel: 'Kamar Tidur Barat · Meja Belajar',
    dateOrTag: 'CATATAN RUMAH · HARI KE-14',
    excerpt:
      'Tanggal merah dilingkari pensil dengan tulisan tangan Ibu: “Rindi masih lemas habis DBD, belum boleh banyak lari. Catatan listrik Ayah: Jalur Ruang Musik Atas putus—nyalakan Saklar I & III, matikan II, nyalakan IV supaya tidak korsleting.”',
    contextNote:
      'Saat masih lemah sehabis sakit, anak kecil tidak punya tenaga untuk lari atau melawan.',
    clueHint: 'Susunan Panel Sekring Gudang Timur: Saklar I [NYALA], II [MATI], III [NYALA], IV [NYALA].',
    accentColor: '#78a9c4',
  },
  clue_1_diary: {
    id: 'clue_1_diary',
    layerIndex: 0,
    category: 'dokumen',
    title: 'Kartu Berobat & Catatan Gudang Timur',
    locationLabel: 'Gudang Sempit Timur',
    dateOrTag: 'KARTU RAWAT JALAN · USIA 6 TAHUN',
    excerpt:
      'Terselip di antara kardus tua: kartu kontrol demam berdarah atas nama Rindiani, bersama coretan kecil di balik struk apotek: “Jangan bilang-bilang siapa pun ya, nanti orang tua kita bertengkar.”',
    contextNote:
      'Kalimat seperti ini membuat anak merasa kalau ia cerita, keluarganya bakal hancur karena dirinya.',
    clueHint: 'Panel Sekring di Gudang Timur ini menyalakan kembali Kotak Musik di Ruang Musik Barat Laut.',
    accentColor: '#d4a353',
  },
  clue_1_drawing: {
    id: 'clue_1_drawing',
    layerIndex: 0,
    category: 'benda',
    title: 'Buku Gambar Krayon yang Robek',
    locationLabel: 'Ruang Musik Barat Laut',
    dateOrTag: 'BENDA PRIBADI · MASA KECIL',
    excerpt:
      'Kertas gambar terlipat di sudut meja. Gambar rumah berwarna cerah di bagian bawah, tapi seluruh ruangan lantai dua dicoret tebal krayon biru tua dan hitam tanpa ada satu pun gambar orang.',
    contextNote:
      'Saat anak kecil belum punya kata-kata untuk bercerita, rasa takutnya sering keluar lewat gambar atau diam.',
    accentColor: '#78a9c4',
  },

  // =========================================================================
  // BABAK II: Ruang Kelas & Pintu BK Dirantai
  // =========================================================================
  clue_2_seating: {
    id: 'clue_2_seating',
    layerIndex: 1,
    category: 'dokumen',
    title: 'Denah Bangku & Lingkaran “Candaan Kelas”',
    locationLabel: 'Ruang Kelas Utama',
    dateOrTag: 'CATATAN WALI KELAS',
    excerpt:
      'Selembar denah tempat duduk yang dicoret-coret spidol merah. Enam meja di tengah diberi panah melingkar bertuliskan: “Jangan baperan, ini cuma permainan putar pensil pas jam kosong.”',
    contextNote:
      'Ketika pelecehan dibungkus jadi bercandaan ramai-ramai, anak lain ikut diam karena takut dikucilkan.',
    accentColor: '#d4a353',
  },
  clue_2_janitor: {
    id: 'clue_2_janitor',
    layerIndex: 1,
    category: 'dokumen',
    title: 'Buku Piket Penjaga & Catatan Loker Arsip',
    locationLabel: 'Ruang Alat Timur',
    dateOrTag: 'LOG PENJAGA SEKOLAH · MALAM',
    excerpt:
      '“19.40 WIB — Berkas pengaduan siswi kelas XI dipindahkan ke Ruang Arsip Barat dan dikunci di brankas dokumen. Kode loker memakai nomor ruang rapat lama: 3-0-7. Arahan pimpinan: selesaikan tertutup demi nama baik sekolah.”',
    contextNote:
      'Saat pihak sekolah memilih menutupi laporan, pelaku berjabatan merasa aman sementara korban kehilangan tempat berlindung.',
    clueHint: 'Kode Brankas Arsip di Ruang Arsip Barat: 307.',
    accentColor: '#78a9c4',
  },
  clue_2_dossier: {
    id: 'clue_2_dossier',
    layerIndex: 1,
    category: 'dokumen',
    title: 'Map Kuning “Diselesaikan Secara Kekeluargaan”',
    locationLabel: 'Ruang Arsip Barat',
    dateOrTag: 'ARSIP INTERNAL · DITUTUP',
    excerpt:
      'Map berkas bersampul kuning kusut berstempel “SELESAI INTERNAL — TIDAK PERLU SANKSI PUBLIK”. Nama saksi dicoret tinta hitam, sedangkan pelapor dicatat sebagai “kurang kooperatif”.',
    contextNote:
      'Begitu laporan korban dipaksa berhenti di tengah jalan, ruang konseling justru terasa seperti tempat menghakimi.',
    accentColor: '#c25959',
  },
  clue_2_tally: {
    id: 'clue_2_tally',
    layerIndex: 1,
    category: 'benda',
    title: 'Catatan Goresan di Depan Lorong BK',
    locationLabel: 'Lorong Bimbingan Konseling',
    dateOrTag: 'JEJAK DINDING',
    excerpt:
      'Di dekat deretan loker penyok tertinggal pita nama seragam yang putus dan catatan kecil bertinta buram: “Sudah lapor bulan lalu, tapi Bapak itu tetap mengajar di kelas sebelah.”',
    contextNote:
      'Pelaku yang dibiarkan tanpa sanksi membuat korban percaya bahwa melapor tidak akan mengubah apa-apa.',
    accentColor: '#78a9c4',
  },

  // =========================================================================
  // BABAK III: Labirin Layar & Lorong Gosip
  // =========================================================================
  clue_3_vanity: {
    id: 'clue_3_vanity',
    layerIndex: 2,
    category: 'benda',
    title: 'Memo Meja Rias Kaca Retak',
    locationLabel: 'Galeri Cermin Selatan',
    dateOrTag: 'CATATAN PRIBADI',
    excerpt:
      'Sebuah sticky note menempel di pecahan kaca rias: “Aku selalu pulang tepat waktu, selalu izin ke mana-mana. Kenapa gosip kampus tetap membalik semuanya seolah aku yang salah?”',
    contextNote:
      'Gosip menyalahkan korban sering menghancurkan nama baiknya tanpa memedulikan fakta yang sebenarnya.',
    accentColor: '#9b6eaf',
  },
  clue_3_chat: {
    id: 'clue_3_chat',
    layerIndex: 2,
    category: 'dokumen',
    title: 'Salinan Log Ancaman Pukul 04:19',
    locationLabel: 'Kamar Pesan Malam (Sisi Barat)',
    dateOrTag: 'REKAM JEJAK DIGITAL · 04:19 WIB',
    excerpt:
      'Cetakan chat tengah malam berisi ancaman penyebaran foto rekayasa AI jika permintaan ditolak. Di bagian atas terminal tertera tanda waktu sinkronisasi suar: [SYNC TIMESTAMP: 4-1-9].',
    contextNote:
      'Kekerasan digital (KBGO) memanfaatkan rasa takut akan rusaknya nama baik untuk memaksa dan mengendalikan korban.',
    clueHint: 'Kode Verifikasi Terminal Ruang Suar (Sisi Timur): 419.',
    accentColor: '#78a9c4',
  },
  clue_3_flyer: {
    id: 'clue_3_flyer',
    layerIndex: 2,
    category: 'papan',
    title: 'Tangkapan Layar Grup Gosip Kampus',
    locationLabel: 'Lorong Fitnah Utara',
    dateOrTag: 'JEJAK STIGMA SOSIAL',
    excerpt:
      'Kertas basah berisi tangkapan komentar anonim yang menyalahkan korban. Di bawahnya tertulis satu kalimat pena biru dari Bima: “Kejahatan digital pelaku bukan salah korban.”',
    contextNote:
      'Orang-orang yang ikut menyebarkan gosip tanpa tahu duduk perkaranya justru menambah berat luka korban.',
    accentColor: '#c25959',
  },
  clue_3_bracelet: {
    id: 'clue_3_bracelet',
    layerIndex: 2,
    category: 'benda',
    title: 'Tali Gelang Putus & Pin Share-Loc',
    locationLabel: 'Ruang Suar (Sisi Timur)',
    dateOrTag: 'BUKTI PENYELAMATAN',
    excerpt:
      'Gelang rajut yang talinya terputus tergeletak di dekat pemancar suar biru, berdampingan dengan pesan singkat teman dekatnya: “Lokasimu sudah masuk. Tunggu di tempat terang, kami lagi jalan ke sana.”',
    contextNote:
      'Berani membagikan lokasi ke teman tepercaya sering jadi langkah penyelamat saat terjebak dalam hubungan yang penuh ancaman.',
    accentColor: '#78a9c4',
  },

  // =========================================================================
  // BABAK IV: Kubah Kaca di Sudut Kampus
  // =========================================================================
  clue_4_letter: {
    id: 'clue_4_letter',
    layerIndex: 3,
    category: 'dokumen',
    title: 'Surat Solidaritas di Bangku Taman',
    locationLabel: 'Taman Memorial Barat Daya',
    dateOrTag: 'SURAT DUKUNGAN MAHASISWA',
    excerpt:
      '“Buat siapa pun yang selama ini dipaksa diam: kamu nggak sendirian, dan keberanianmu cerita nggak akan kami balas dengan tawa atau penghakiman.”',
    contextNote:
      'Ruang aman mulai terbentuk saat lingkungan berhenti menganggap pelecehan sebagai bahan bercanda.',
    accentColor: '#d4a353',
  },
  clue_4_satgas: {
    id: 'clue_4_satgas',
    layerIndex: 3,
    category: 'papan',
    title: 'Papan Protokol Resmi Satgas PPKS',
    locationLabel: 'Papan Pengumuman Tenggara',
    dateOrTag: 'ALUR LAYANAN KAMPUS · PROAKTIF',
    excerpt:
      'Panduan penanganan kekerasan seksual di kampus menetapkan empat tahap wajib secara berurutan: 1. DENGAR (beri ruang aman tanpa menghakimi) → 2. LINDUNGI (jaga keamanan pelapor) → 3. TINDAK (jatuhkan sanksi tegas) → 4. PULIHKAN (dampingi pemulihan korban).',
    contextNote:
      'Perlindungan yang benar butuh layanan yang aktif bekerja, bukan cuma spanduk atau poster imbauan.',
    clueHint: 'Urutan Protokol Terminal Satgas (Utara Kubah): 1. Dengar → 2. Lindungi → 3. Tindak → 4. Pulihkan.',
    accentColor: '#78a9c4',
  },
  clue_4_charter: {
    id: 'clue_4_charter',
    layerIndex: 3,
    category: 'papan',
    title: 'Plakat Komitmen Kampus Tanpa Impunitas',
    locationLabel: 'Kolonade Batu Timur Laut',
    dateOrTag: 'DEKLARASI RUANG AMAN',
    excerpt:
      'Terukir pada plakat perunggu di sela pilar batu: “Tidak ada jabatan, senioritas, atau nama baik institusi yang lebih berharga daripada keselamatan dan keadilan bagi korban.”',
    contextNote:
      'Aturan yang adil memastikan pelaku tidak bisa bersembunyi di balik jabatan atau senioritas.',
    accentColor: '#d4a353',
  },
  clue_4_ribbon: {
    id: 'clue_4_ribbon',
    layerIndex: 3,
    category: 'benda',
    title: 'Lilin Harapan & Pita Pemulihan',
    locationLabel: 'Sudut Hening Barat Laut',
    dateOrTag: 'SIMBOL PEMULIHAN',
    excerpt:
      'Beberapa lilin hangat menyala pelan di atas salju, menjaga pita kuning tetap terlihat jelas di tengah malam kampus yang dingin.',
    contextNote:
      'Pemulihan mental dan pengembalian harga diri adalah hak penuh setiap penyintas.',
    accentColor: '#9b6eaf',
  },
};

export const PUZZLE_CONFIGS: Record<string, PuzzleConfig> = {
  puzzle_1_fusebox: {
    id: 'puzzle_1_fusebox',
    layerIndex: 0,
    kind: 'fusebox',
    title: 'Panel Sekring Lantai Atas',
    subtitle: 'Gudang Timur · Daya Ruang Musik',
    prompt:
      'Listrik menuju Kotak Musik di Ruang Musik Barat Laut padam. Atur keempat saklar pemutus arus sesuai catatan listrik di kalender agar kotak musik bisa menyala lagi.',
    hint: 'Cek Kalender Pemulihan DBD di Kamar Tidur Barat: jalur aman memakai Saklar I NYALA, II MATI, III NYALA, dan IV NYALA.',
    relatedClueId: 'clue_1_calendar',
    unlockTargetLabel: 'Kotak Musik Panggilan Ibu (Ruang Musik Barat Laut)',
    solutionCode: '1011',
  },
  puzzle_2_archive: {
    id: 'puzzle_2_archive',
    layerIndex: 1,
    kind: 'keypad',
    title: 'Kunci Brankas Arsip BK',
    subtitle: 'Ruang Arsip Barat · Berkas Tertutup',
    prompt:
      'Brankas berkas laporan sekolah terkunci kode 3 digit. Masukkan nomor kombinasi yang dicatat penjaga malam untuk membuka bukti laporan siswi.',
    hint: 'Lihat Buku Piket Penjaga Sekolah di Ruang Alat Timur untuk menemukan 3 digit kode loker arsip.',
    relatedClueId: 'clue_2_janitor',
    unlockTargetLabel: 'Berkas Laporan Sekolah (Ruang Arsip Barat)',
    solutionCode: '307',
  },
  puzzle_3_terminal: {
    id: 'puzzle_3_terminal',
    layerIndex: 2,
    kind: 'terminal',
    title: 'Terminal Suar Share-Loc',
    subtitle: 'Ruang Suar Timur · Sinkronisasi Waktu',
    prompt:
      'Pemancar Suar Biru terkunci oleh sistem verifikasi 3 digit. Masukkan jam pengiriman pesan ancaman larut malam untuk membuka sinyal Share-Loc.',
    hint: 'Cek Salinan Log Ancaman di Kamar Pesan Malam (Sisi Barat) untuk melihat 3 digit SYNC TIMESTAMP.',
    relatedClueId: 'clue_3_chat',
    unlockTargetLabel: 'Suar Biru Share-Loc (Ruang Suar Timur)',
    solutionCode: '419',
  },
  puzzle_4_satgas: {
    id: 'puzzle_4_satgas',
    layerIndex: 3,
    kind: 'satgas',
    title: 'Terminal Protokol Satgas PPKS',
    subtitle: 'Plaza Utara Kampus · Penguat Perlindungan',
    prompt:
      'Pilih keempat tahapan perlindungan korban secara berurutan untuk melemahkan badai salju di sekitar Kubah Kaca dan membuka kekuatan Lentera pelindung.',
    hint: 'Baca Papan Protokol Resmi Satgas PPKS di Tenggara: Dengar → Lindungi → Tindak → Pulihkan.',
    relatedClueId: 'clue_4_satgas',
    unlockTargetLabel: 'Protokol Pelindung Kubah Kaca (Halaman Kampus)',
    solutionCode: 'DENGAR-LINDUNGI-TINDAK-PULIHKAN',
  },
};

export function getLoreByLayer(layerIndex: number): LoreClueData[] {
  return Object.values(LORE_CLUES).filter((c) => c.layerIndex === layerIndex);
}
