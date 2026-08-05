export type ManualBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'steps'; items: string[] }
  | { type: 'notes'; items: string[] }
  | { type: 'warning'; title: string; text: string }
  | { type: 'statuses'; items: Array<{ label: string; meaning: string; action: string }> };

export type ManualSection = {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  blocks: ManualBlock[];
};

export const manualSections: ManualSection[] = [
  {
    id: 'mulai-cepat',
    title: 'Mulai Cepat',
    summary: 'Panduan singkat untuk mulai menggunakan AirVIA Configurator.',
    keywords: ['mulai', 'cepat', 'instalasi', 'pertama', 'connect'],
    blocks: [
      { type: 'paragraph', text: 'AirVIA Configurator adalah aplikasi berbasis web untuk mengonfigurasi keyboard AirVIA melalui Web Bluetooth di browser yang didukung. Aplikasi berjalan sepenuhnya di sisi klien, tanpa server.' },
      { type: 'steps', items: [
        'Buka aplikasi di browser berbasis Chromium (Chrome, Edge, Opera) versi terbaru.',
        'Hubungkan keyboard AirVIA melalui Web Bluetooth.',
        'Klik tombol "Connect" pada bilah atas atau halaman utama.',
        'Pilih perangkat AirVIA dari dialog Bluetooth pairing yang muncul.',
        'Setelah tersambung, indikator status berubah menjadi hijau dan Anda siap mengonfigurasi.'
      ]},
      { type: 'notes', items: [
        'Browser harus mendukung Web Bluetooth. Safari dan Firefox belum mendukung Web Bluetooth penuh.',
        'Pastikan keyboard dalam mode operasi normal (bukan mode bootloader).'
      ]},
      { type: 'warning', title: 'Versi RC', text: 'Aplikasi ini versi v1.0.0-rc.1. Semua fitur telah diverifikasi melalui simulator. Pengujian pada perangkat keras masih menunggu konfirmasi.' }
    ]
  },
  {
    id: 'browser',
    title: 'Browser',
    summary: 'Informasi browser yang kompatibel dan cara penyiapan.',
    keywords: ['browser', 'chromium', 'webbluetooth', 'kompatibilitas', 'edge', 'opera', 'brave'],
    blocks: [
      { type: 'paragraph', text: 'AirVIA Configurator memerlukan browser dengan dukungan Web Bluetooth. Web Bluetooth adalah API yang memungkinkan aplikasi web berkomunikasi dengan perangkat BLE (Bluetooth Low Energy).' },
      { type: 'notes', items: [
        'Google Chrome 122+ atau Edge 122+ direkomendasikan untuk pengalaman terbaik.',
        'Microsoft Edge 122+ didukung penuh.',
        'Opera dan Brave berbasis Chromium juga kompatibel, namun mungkin memerlukan pengaktifan Web Bluetooth di flags.',
        'Safari dan Firefox: Web Bluetooth belum didukung. Gunakan browser Chromium untuk mengonfigurasi keyboard Anda.'
      ]},
      { type: 'steps', items: [
        'Pastikan browser Anda versi Chrome/Edge 122 atau lebih baru.',
        'Jika menggunakan Brave/Opera, kunjungi chrome://flags dan aktifkan "Experimental Web Platform features".',
        'Tidak diperlukan ekstensi atau plugin tambahan — seluruh konfigurasi berjalan di tab browser.'
      ]}
    ]
  },
  {
    id: 'definition-v3',
    title: 'Definition V3',
    summary: 'Penjelasan format berkas definisi V3 untuk keyboard AirVIA.',
    keywords: ['definition', 'v3', 'berkas', 'format', 'json', 'definisi'],
    blocks: [
      { type: 'paragraph', text: 'Berkas definisi V3 (berekstensi .via3.json) adalah cetak biru keyboard AirVIA. Berkas ini mendeskripsikan layout matriks, opsi keymap, konfigurasi encoder, pengaturan pencahayaan, dan opsi tata letak yang didukung oleh keyboard.' },
      { type: 'notes', items: [
        'Ekstensi berkas: .via3.json',
        'Berkas definisi V3 menggantikan format V2 yang lama.',
        'Berkas ini diperlukan agar pengonfigurasi mengenali keyboard Anda dan menampilkan UI yang sesuai.',
        'Definisi V3 mendukung fitur-fitur baru: keymap kompleks, encoder multi-mode, dan pencahayaan per-zona.'
      ]},
      { type: 'warning', title: 'Validasi Berkas', text: 'Berkas definisi V3 harus valid secara JSON dan memenuhi skema AirVIA V3. Berkas yang tidak valid akan ditolak dan menampilkan pesan kesalahan di tab Console.' }
    ]
  },
  {
    id: 'connect',
    title: 'Connect',
    summary: 'Cara menyambungkan keyboard AirVIA ke Configurator.',
    keywords: ['connect', 'sambung', 'webbluetooth', 'pairing', 'koneksi'],
    blocks: [
      { type: 'paragraph', text: 'Koneksi antara AirVIA Configurator dan keyboard dilakukan melalui Web Bluetooth. Setiap sesi koneksi bersifat sementara dan harus diinisiasi ulang saat halaman dimuat ulang.' },
      { type: 'steps', items: [
        'Klik tombol "Connect" di pojok kanan atas bilah navigasi.',
        'Dialog Bluetooth pairing akan muncul menampilkan perangkat BLE yang tersedia.',
        'Pilih perangkat keyboard AirVIA Anda dan klik "Connect".',
        'Tunggu hingga indikator status berubah hijau dengan teks "Connected".'
      ]},
      { type: 'notes', items: [
        'Jika perangkat tidak muncul, pastikan keyboard dalam mode BLE pairing dan tidak dalam mode bootloader.',
        'Koneksi hanya bertahan selama sesi tab browser. Muat ulang halaman akan memutus koneksi.',
        'Hanya satu keyboard yang dapat tersambung dalam satu waktu.'
      ]},
      { type: 'statuses', items: [
        { label: 'Disconnected', meaning: 'Belum ada koneksi ke perangkat.', action: 'Klik Connect untuk memulai.' },
        { label: 'Connecting', meaning: 'Sedang menjalin koneksi.', action: 'Tunggu atau pilih perangkat di dialog.' },
        { label: 'Connected', meaning: 'Koneksi aktif — siap konfigurasi.', action: 'Tidak perlu tindakan.' },
        { label: 'Error', meaning: 'Koneksi gagal.', action: 'Coba ulang atau periksa Console.' }
      ]}
    ]
  },
  {
    id: 'sync-status',
    title: 'Sync / Status',
    summary: 'Memahami status sinkronisasi antara aplikasi dan keyboard.',
    keywords: ['sync', 'status', 'sinkron', 'indikator', 'tersimpan'],
    blocks: [
      { type: 'paragraph', text: 'AirVIA Configurator menampilkan status sinkronisasi antara konfigurasi di UI dan yang tersimpan di keyboard. Indikator status membantu Anda mengetahui apakah perubahan sudah diterapkan ke perangkat.' },
      { type: 'statuses', items: [
        { label: 'Synced', meaning: 'Semua perubahan di UI sudah dikirim dan disimpan di keyboard.', action: 'Tidak perlu tindakan.' },
        { label: 'Modified', meaning: 'Ada perubahan di UI yang belum disimpan ke keyboard.', action: 'Klik "Save" atau "Apply" untuk menyimpan.' },
        { label: 'Saving', meaning: 'Sedang mengirim data ke keyboard.', action: 'Tunggu hingga selesai.' },
        { label: 'Conflict', meaning: 'Konfigurasi di UI berbeda dari keyboard dan tidak dapat digabung otomatis.', action: 'Pilih: terapkan UI ke keyboard atau muat ulang dari keyboard.' }
      ]},
      { type: 'notes', items: [
        'Status sinkronisasi diperbarui setiap kali Anda mengubah nilai di editor.',
        'Perubahan pada Keymap, Encoder, Lighting, Macro, dan Layout masing-masing dilacak secara terpisah.'
      ]}
    ]
  },
  {
    id: 'keymap',
    title: 'Keymap',
    summary: 'Panduan menggunakan Keymap Editor untuk mengatur penekanan tombol.',
    keywords: ['keymap', 'tombol', 'keycode', 'matrix', 'remap'],
    blocks: [
      { type: 'paragraph', text: 'Keymap Editor adalah antarmuka utama untuk mengatur fungsi setiap tombol pada keyboard AirVIA. Anda dapat mengubah keycode dasar, menetapkan layer, dan mengonfigurasi perilaku khusus seperti tap-dance dan hold-tap.' },
      { type: 'steps', items: [
        'Buka tab "Keymap" dari bilah navigasi.',
        'Klik sel tombol yang ingin diubah pada tampilan matrix.',
        'Pilih keycode baru dari dropdown Keycode Picker yang muncul.',
        'Ulangi untuk setiap tombol yang ingin dikonfigurasi.',
        'Klik "Apply" atau "Save" untuk menyimpan perubahan ke keyboard.'
      ]},
      { type: 'notes', items: [
        'Setiap tombol mendukung hingga 4 layer yang dapat diakses dengan tombol Fn/MO.',
        'Keycode khusus seperti KC_TRNS (transparent) meneruskan ke layer di bawahnya.',
        'Layer 0 adalah layer dasar. Layer 1-3 diaktifkan melalui momentary layer switch.',
        'Perubahan keymap ditampilkan secara visual di matrix dengan warna yang menunjukkan jenis keycode.'
      ]}
    ]
  },
  {
    id: 'encoder',
    title: 'Encoder',
    summary: 'Konfigurasi rotary encoder pada keyboard.',
    keywords: ['encoder', 'rotary', 'putar', 'CW', 'CCW', 'encoder'],
    blocks: [
      { type: 'paragraph', text: 'Jika keyboard AirVIA Anda memiliki rotary encoder (kenop putar), Anda dapat mengonfigurasi aksi untuk putaran searah jarum jam (CW), berlawanan jarum jam (CCW), dan tekan tombol encoder. Setiap encoder mendukung hingga 4 layer aksi.' },
      { type: 'steps', items: [
        'Buka tab "Encoder" dari bilah navigasi.',
        'Pilih encoder yang ingin dikonfigurasi dari daftar.',
        'Untuk setiap layer, atur aksi CW, CCW, dan tombol tekan.',
        'Klik sel aksi dan pilih fungsi dari dropdown.',
        'Klik "Apply" untuk menyimpan konfigurasi encoder ke keyboard.'
      ]},
      { type: 'notes', items: [
        'Tidak semua keyboard memiliki encoder. Jika tidak ada encoder, tab akan kosong.',
        'Aksi encoder dapat berupa keycode, macro, atau fungsi khusus seperti volume, scroll, dan brightness.',
        'Encoder dapat dikonfigurasi berbeda untuk setiap layer.'
      ]}
    ]
  },
  {
    id: 'lighting',
    title: 'Lighting',
    summary: 'Mengontrol pencahayaan RGB pada keyboard.',
    keywords: ['lighting', 'rgb', 'lampu', 'brightness', 'efek', 'warna'],
    blocks: [
      { type: 'paragraph', text: 'Tab Lighting memungkinkan Anda mengontrol pencahayaan RGB keyboard: kecerahan, efek animasi, palet warna, dan kecepatan efek. Pengaturan dapat disimpan per-layer atau global.' },
      { type: 'steps', items: [
        'Buka tab "Lighting" dari bilah navigasi.',
        'Gunakan slider "Brightness" untuk mengatur kecerahan (0-255).',
        'Pilih efek pencahayaan dari dropdown "Effect".',
        'Sesuaikan palet warna, kecepatan, dan arah efek sesuai preferensi.',
        'Klik "Apply" untuk menerapkan pengaturan pencahayaan ke keyboard.'
      ]},
      { type: 'notes', items: [
        'Nilai brightness 0 mematikan semua lampu LED.',
        'Beberapa efek mendukung pengaturan tambahan: kecepatan, arah, dan palet multi-warna.',
        'Pengaturan lighting dapat berbeda untuk setiap layer, memungkinkan indikator visual layer aktif.',
        'Tidak semua keyboard mendukung pencahayaan per-zona — tergantung definisi V3.'
      ]}
    ]
  },
  {
    id: 'layout',
    title: 'Layout',
    summary: 'Konfigurasi opsi tata letak keyboard.',
    keywords: ['layout', 'tata letak', 'opsi', 'split', 'ISO', 'ANSI', 'bottom row'],
    blocks: [
      { type: 'paragraph', text: 'Tab Layout memungkinkan Anda mengaktifkan atau menonaktifkan opsi tata letak fisik keyboard seperti split spacebar, bottom row alternatif, Enter ISO/ANSI, dan opsi khusus lainnya yang didukung definisi V3 keyboard Anda.' },
      { type: 'steps', items: [
        'Buka tab "Layout" dari bilah navigasi.',
        'Aktifkan atau nonaktifkan opsi tata letak yang diinginkan menggunakan toggle.',
        'Setiap toggle merepresentasikan opsi fisik yang didukung oleh PCB keyboard.',
        'Klik "Apply" untuk menyimpan perubahan opsi tata letak ke keyboard.'
      ]},
      { type: 'notes', items: [
        'Opsi layout yang tersedia bergantung pada definisi V3 keyboard Anda.',
        'Mengubah opsi layout dapat memengaruhi matrix keymap — tombol mungkin berpindah posisi.',
        'Opsi umum: Split Backspace, Split Right Shift, ISO Enter, Bottom Row 6.25U/7U.',
        'Jangan ubah opsi layout saat keyboard sedang digunakan untuk menghindari kebingungan input.'
      ]}
    ]
  },
  {
    id: 'macro',
    title: 'Macro',
    summary: 'Membuat dan mengelola urutan makro.',
    keywords: ['macro', 'makro', 'urutan', 'rekam', 'otomatis', 'perintah'],
    blocks: [
      { type: 'paragraph', text: 'Macro Editor memungkinkan Anda merekam dan mengedit urutan penekanan tombol yang dapat dipicu dengan satu tombol. Macro mendukung penundaan (delay), kombinasi tombol, dan teks yang diketik otomatis.' },
      { type: 'steps', items: [
        'Buka tab "Macro" dari bilah navigasi.',
        'Klik "New Macro" untuk membuat macro baru.',
        'Beri nama macro yang deskriptif, misalnya "Buka Email" atau "Screenshot".',
        'Klik "Record" dan ketik urutan tombol yang diinginkan. Klik "Stop" saat selesai.',
        'Anda juga dapat mengedit urutan secara manual: tambah, hapus, atau ubah keycode per langkah.',
        'Klik "Apply" untuk menyimpan macro ke keyboard.',
        'Untuk menggunakan macro, tetapkan macro tersebut ke tombol melalui Keymap Editor.'
      ]},
      { type: 'notes', items: [
        'Jumlah macro maksimal dan panjang setiap macro bergantung pada firmware keyboard.',
        'Macro dapat menyertakan penundaan (delay) antar langkah dalam milidetik.',
        'Gunakan macro untuk otomatisasi alur kerja seperti membuka aplikasi, memasukkan teks berulang, atau shortcut kompleks.'
      ]}
    ]
  },
  {
    id: 'profiles',
    title: 'Profiles',
    summary: 'Menyimpan dan memulihkan profil konfigurasi.',
    keywords: ['profile', 'profil', 'simpan', 'ekspor', 'impor', 'cadangan'],
    blocks: [
      { type: 'paragraph', text: 'Tab Profiles memungkinkan Anda menyimpan seluruh konfigurasi keyboard sebagai profil. Anda dapat mengekspor profil ke berkas JSON, mengimpornya kembali, dan beralih antar profil dengan cepat.' },
      { type: 'steps', items: [
        'Buka tab "Profiles" dari bilah navigasi.',
        'Klik "Export Profile" untuk mengunduh konfigurasi saat ini sebagai berkas JSON.',
        'Untuk memulihkan, klik "Import Profile" dan pilih berkas JSON yang sebelumnya diekspor.',
        'Konfigurasi yang diimpor akan menggantikan pengaturan di UI. Klik "Apply" untuk mengirim ke keyboard.'
      ]},
      { type: 'notes', items: [
        'Profil mencakup: keymap, encoder, lighting, macro, dan layout.',
        'Profil tidak mencakup berkas definisi V3 — definisi harus diimpor terpisah.',
        'Simpan profil secara berkala sebagai cadangan sebelum melakukan perubahan besar.',
        'Profil bersifat portabel — dapat dipindahkan antar komputer yang sama-sama memiliki definisi V3 yang kompatibel.'
      ]},
      { type: 'warning', title: 'Kompatibilitas', text: 'Profil yang diekspor hanya kompatibel dengan keyboard yang menggunakan definisi V3 yang sama persis. Memuat profil dari definisi berbeda dapat menyebabkan perilaku tak terduga.' }
    ]
  },
  {
    id: 'save-apply-verify',
    title: 'Save / Apply / Verify',
    summary: 'Memahami perbedaan antara Save, Apply, dan Verify.',
    keywords: ['save', 'apply', 'verify', 'simpan', 'terapkan', 'verifikasi'],
    blocks: [
      { type: 'paragraph', text: 'AirVIA Configurator memiliki tiga operasi untuk mengelola perubahan konfigurasi: Apply, Save, dan Verify. Ketiganya memiliki tujuan berbeda dan digunakan dalam alur kerja yang berbeda.' },
      { type: 'statuses', items: [
        { label: 'Apply', meaning: 'Mengirim perubahan ke memori aktif (RAM) keyboard secara langsung.', action: 'Gunakan untuk uji coba cepat. Perubahan hilang saat keyboard dimatikan jika belum di-Save.' },
        { label: 'Save', meaning: 'Menyimpan konfigurasi ke memori permanen (EEPROM/flash) keyboard.', action: 'Gunakan untuk menyimpan konfigurasi secara permanen — bertahan setelah keyboard dimatikan.' },
        { label: 'Verify', meaning: 'Membandingkan konfigurasi di UI dengan yang tersimpan di keyboard.', action: 'Gunakan untuk memastikan tidak ada perbedaan antara UI dan keyboard.' }
      ]},
      { type: 'notes', items: [
        'Apply lebih cepat daripada Save karena hanya menulis ke RAM.',
        'Save direkomendasikan setelah Anda puas dengan konfigurasi.',
        'Verify mendeteksi perbedaan dan melaporkan di tab Console.',
        'Alur tipikal: Edit → Apply (uji coba) → Save (simpan permanen) → Verify (konfirmasi).'
      ]}
    ]
  },
  {
    id: 'disconnect-recovery',
    title: 'Disconnect / Recovery',
    summary: 'Prosedur pemutusan dan pemulihan koneksi.',
    keywords: ['disconnect', 'putus', 'pemulihan', 'reconnect', 'driver', 'bluetooth'],
    blocks: [
      { type: 'paragraph', text: 'Koneksi Web Bluetooth dapat terputus karena berbagai alasan: sinyal BLE lemah, keyboard masuk mode tidur, browser ditutup, atau driver sistem bentrok. Halaman ini menjelaskan prosedur pemulihan.' },
      { type: 'steps', items: [
        'Periksa status baterai keyboard — pastikan baterai mencukupi dan keyboard dalam mode pairing.',
        'Jika indikator status berubah menjadi "Disconnected", klik tombol "Connect" untuk memulai ulang koneksi.',
        'Jika keyboard tidak muncul di dialog Bluetooth pairing, matikan dan nyalakan kembali keyboard.',
        'Jika masih tidak terdeteksi, periksa tab "Console" untuk pesan kesalahan.',
        'Sebagai langkah terakhir, muat ulang halaman (F5) dan coba Connect kembali.'
      ]},
      { type: 'notes', items: [
        'Konfigurasi yang sudah di-Save tidak hilang saat koneksi terputus.',
        'Konfigurasi yang hanya di-Apply (belum di-Save) akan hilang jika keyboard kehilangan daya.',
        'Jika koneksi sering terputus tanpa sebab jelas, periksa sinyal BLE dan pastikan tidak ada interferensi dari perangkat lain.'
      ]},
      { type: 'warning', title: 'Bootloader', text: 'Jika keyboard masuk mode bootloader (DFU), keyboard tidak akan muncul di dialog Bluetooth pairing. Untuk keluar dari mode bootloader, matikan keyboard, tunggu 5 detik, lalu nyalakan kembali. Jika masalah berlanjut, gunakan tombol reset fisik di PCB.' }
    ]
  },
  {
    id: 'ble-troubleshooting',
    title: 'Pemecahan Masalah BLE',
    summary: 'Panduan mengatasi masalah koneksi Bluetooth LE.',
    keywords: ['BLE', 'bluetooth', 'nirkabel', 'pairing', 'baterai', 'gangguan'],
    blocks: [
      { type: 'paragraph', text: 'Jika keyboard AirVIA mendukung BLE (Bluetooth Low Energy), Anda mungkin menghadapi masalah koneksi nirkabel. Konfigurasi dilakukan melalui Web Bluetooth API untuk komunikasi data.' },
      { type: 'steps', items: [
        'Pastikan baterai keyboard mencukupi — baterai rendah menyebabkan koneksi tidak stabil.',
        'Hapus pairing lama dari pengaturan Bluetooth sistem operasi, lalu pair ulang.',
        'Jaga jarak keyboard dalam 3 meter dari komputer — sinyal BLE melemah seiring jarak.',
        'Hindari penghalang logam antara keyboard dan komputer.',
        'Matikan perangkat BLE lain di sekitar yang dapat menyebabkan interferensi.'
      ]},
      { type: 'notes', items: [
        'Web Bluetooth API hanya didukung oleh Chrome dan Edge (tidak di Firefox/Safari).',
        'Konfigurasi melalui BLE mungkin lebih lambat dibandingkan USB karena bandwidth BLE terbatas.',
        'Baterai lithium direkomendasikan — baterai alkaline dapat memberikan tegangan tidak stabil.',
        'Untuk konfigurasi besar (seluruh keymap), disarankan menggunakan koneksi USB.'
      ]},
      { type: 'warning', title: 'BLE vs USB', text: 'Fitur Web Bluetooth masih eksperimental. Konfigurasi andal disarankan melalui USB. BLE cocok untuk perubahan kecil seperti menyesuaikan kecerahan atau beralih profil.' }
    ]
  },
  {
    id: 'definition-profile-errors',
    title: 'Kesalahan Definisi dan Profil',
    summary: 'Memahami dan mengatasi error definisi V3 dan profil.',
    keywords: ['error', 'kesalahan', 'definisi', 'profil', 'validasi', 'json'],
    blocks: [
      { type: 'paragraph', text: 'AirVIA Configurator memvalidasi berkas definisi V3 dan profil sebelum memuatnya. Jika ditemukan kesalahan, pesan akan ditampilkan di tab Console. Berikut adalah jenis kesalahan umum dan cara mengatasinya.' },
      { type: 'statuses', items: [
        { label: 'Invalid JSON', meaning: 'Berkas tidak dapat diurai sebagai JSON.', action: 'Perbaiki sintaks JSON menggunakan validator JSON online atau editor teks.' },
        { label: 'Schema Mismatch', meaning: 'Berkas JSON valid tetapi tidak memenuhi skema definisi V3.', action: 'Periksa dokumentasi skema V3 dan pastikan semua field wajib tersedia.' },
        { label: 'Checksum Error', meaning: 'Checksum firmware tidak cocok dengan definisi.', action: 'Pastikan definisi V3 dibuat untuk versi firmware yang terpasang di keyboard.' },
        { label: 'Profile Mismatch', meaning: 'Profil yang diimpor tidak kompatibel dengan definisi saat ini.', action: 'Pastikan profil berasal dari keyboard dengan definisi V3 yang sama.' },
        { label: 'Missing Keycodes', meaning: 'Keycode yang direferensikan tidak dikenal.', action: 'Perbarui definisi V3 atau gunakan keycode yang didukung.' }
      ]},
      { type: 'notes', items: [
        'Semua error dilaporkan di tab Console dengan detail baris dan kolom.',
        'Berkas definisi V3 harus memiliki ekstensi .via3.json.',
        'Jangan mengedit berkas definisi V3 secara manual kecuali Anda memahami skemanya — gunakan generator definisi resmi.'
      ]}
    ]
  },
  {
    id: 'privacy-security',
    title: 'Privasi dan Keamanan',
    summary: 'Informasi privasi, keamanan data, dan izin browser.',
    keywords: ['privasi', 'keamanan', 'data', 'izin', 'browser', 'lokal', 'security'],
    blocks: [
      { type: 'paragraph', text: 'AirVIA Configurator dirancang dengan privasi sebagai prioritas. Semua data konfigurasi diproses secara lokal di browser Anda. Tidak ada data yang dikirim ke server eksternal atau pihak ketiga.' },
      { type: 'notes', items: [
        'Tidak ada telemetri, pelacakan, atau analitik yang dikumpulkan.',
        'Definisi V3 dan profil disimpan di sistem berkas lokal Anda — tidak diunggah ke mana pun.',
        'Web Bluetooth hanya mengakses perangkat yang Anda pilih secara eksplisit melalui dialog browser.',
        'Aplikasi tidak meminta izin selain Web Bluetooth.',
        'Kode sumber tersedia terbuka untuk audit mandiri.'
      ]},
      { type: 'steps', items: [
        'Izin Web Bluetooth hanya diminta saat Anda mengklik tombol Connect.',
        'Anda dapat mencabut izin kapan saja melalui pengaturan site permissions browser.',
        'Tidak diperlukan akun atau pendaftaran untuk menggunakan aplikasi.'
      ]},
      { type: 'warning', title: 'Peringatan', text: 'Meskipun data tidak dikirim ke server, berkas definisi dan profil yang diekspor tersimpan di komputer Anda. Lindungi berkas tersebut jika berisi konfigurasi yang sensitif (misalnya macro dengan kata sandi).' }
    ]
  },
  {
    id: 'rc-hardware-limitations',
    title: 'Keterbatasan RC dan Perangkat Keras',
    summary: 'Keterbatasan versi RC dan pertimbangan perangkat keras.',
    keywords: ['RC', 'keterbatasan', 'perangkat keras', 'simulator', 'rc1', 'beta', 'limitations'],
    blocks: [
      { type: 'paragraph', text: 'Versi v1.0.0-rc.1 adalah rilis kandidat (Release Candidate) yang telah diverifikasi penuh melalui simulator internal. Meskipun semua fitur berfungsi seperti yang diharapkan di simulator, pengujian pada perangkat keras fisik masih menunggu konfirmasi dari pengguna beta.' },
      { type: 'notes', items: [
        'Semua alur konfigurasi (keymap, encoder, lighting, macro, layout, profil) telah diuji via simulator dan lulus.',
        'Web Bluetooth dan komunikasi serial telah diuji via simulator loopback.',
        'Performa pada perangkat keras nyata mungkin berbeda karena variasi firmware, chip, dan lingkungan.',
        'Fitur-fitur yang bergantung pada kemampuan firmware spesifik (seperti tap-dance lanjutan) mungkin memiliki perbedaan perilaku.',
        'Laporkan masalah yang ditemukan melalui kanal umpan balik yang tersedia.'
      ]},
      { type: 'statuses', items: [
        { label: 'Simulator Verified', meaning: 'Fitur telah diuji dan lulus di simulator.', action: 'Dapat digunakan dengan keyakinan tinggi.' },
        { label: 'Hardware Pending', meaning: 'Fitur ini belum diuji pada perangkat keras fisik.', action: 'Gunakan dengan hati-hati; laporkan jika ada masalah.' },
        { label: 'Known Issue', meaning: 'Masalah diketahui dan sedang dalam perbaikan.', action: 'Lihat dokumentasi untuk solusi sementara.' }
      ]},
      { type: 'warning', title: 'RC Disclaimer', text: 'Ini adalah rilis kandidat untuk pengujian. Jangan gunakan untuk lingkungan produksi atau konfigurasi kritis tanpa memverifikasi di perangkat keras terlebih dahulu. Backup profil Anda sebelum melakukan perubahan signifikan.' }
    ]
  }
];

function flattenBlock(block: ManualBlock): string {
  switch (block.type) {
    case 'paragraph':
      return block.text;
    case 'steps':
    case 'notes':
      return block.items.join(' ');
    case 'warning':
      return `${block.title} ${block.text}`;
    case 'statuses':
      return block.items.map(i => `${i.label} ${i.meaning} ${i.action}`).join(' ');
  }
}

export function searchManual(query: string): ManualSection[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [...manualSections];

  return manualSections.filter(section => {
    const text = [
      section.title,
      section.summary,
      ...section.keywords,
      ...section.blocks.map(flattenBlock),
    ].join(' ').toLowerCase();
    return text.includes(q);
  });
}
