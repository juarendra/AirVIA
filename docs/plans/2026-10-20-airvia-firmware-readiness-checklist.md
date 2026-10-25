# AirVIA + VIA-Arduino — Readiness Plan dan Master Checklist

> **Untuk pelaksana:** gunakan skill `executing-plans` atau `subagent-driven-development` ketika implementasi disetujui. Dokumen ini master roadmap lintas repo, bukan perintah langsung mengubah atau merilis kode. Pecah work package menjadi implementasi kecil saat dikerjakan; jangan menyalin snippet dari rencana lama tanpa mencocokkan kode sekarang.

**Goal:** menyelesaikan pekerjaan aplikasi–firmware sampai siap pengujian hardware terstruktur, lalu lolos gate produksi dengan bukti end-to-end dan prosedur pemulihan.

**Architecture:** pertahankan Svelte UI → state sesi → synchronizer/dispatcher → antrean BLE → VIA protocol core → storage dan keyboard/HID. Kontrak wire, capability, identity, dan persistence disepakati lintas repo; perbaiki implementasi yang ada, bukan menambah framework kedua.

**Tech Stack:** Svelte 5, TypeScript, Vite, Web Bluetooth, Vitest; Arduino C++11, NimBLE, Bluefruit, TinyUSB, NVS/EEPROM/flash/InternalFS; GitHub Actions dan Arduino CLI.

**Tanggal baseline:** 2026-10-20. **Status produk:** belum dinyatakan ready testing penuh atau ready production. Dokumen ini belum merupakan persetujuan scope rilis, angka acceptance, maupun pelaksanaan implementasi.

---

## 1. Cara memakai checklist

- `[x]`: pekerjaan yang dinyatakan pada baris itu selesai dan punya bukti. "Implementasi tersedia" tidak berarti seluruh perilakunya sudah benar atau hardware-certified.
- `[ ]`: pekerjaan mendatang, hasil belum diverifikasi, keputusan belum disahkan, atau acceptance belum dijalankan.
- Jangan centang pekerjaan berdasarkan keberadaan test, nama commit, simulator, atau status dokumen rencana saja. Bukti harus sesuai klaim: kode tersedia, test berjalan, tampilan diamati, atau hardware diuji.
- Untuk item baru yang selesai, tambahkan catatan: tanggal, pelaksana, SHA AirVIA, SHA firmware, definition/board/browser, command/skenario, hasil, dan lokasi artefak. Jangan mengisi PASS tanpa menjalankan skenarionya.
- Untuk hasil gagal: biarkan unchecked dan tambahkan `GAGAL — gejala persis; bukti; tindakan berikutnya`. Untuk menunggu hardware/keputusan: `TERBLOKIR — prasyarat; penanggung jawab; pekerjaan yang masih bisa berjalan`.
- Jika bukti baru membatalkan hasil lama, buka kembali checkbox terkait dan gate yang bergantung padanya.
- ID adalah referensi stabil. Jangan membuat salinan checklist yang hidup terpisah di repo firmware; referensikan dokumen ini dan simpan bukti hardware pada repo terkait.
- Setiap fix: reproduksi/regression test perilaku, perbaikan minimal, verifikasi jalur nyata, update dokumentasi/changelog kedua repo bila terpengaruh. Jangan membuat test yang hanya mencocokkan source text, mock echo, atau wording UI.

### Alias repo dan peran

| Alias | Lokasi | Tanggung jawab |
|---|---|---|
| APP | Repo AirVIA yang memuat dokumen ini | UI, state, definition/profile, BLE client, deployment |
| FW | `D:\Pribadi\VIA-Arduino` | Protocol, matrix, key execution, HID, storage, example/firmware artifact |
| INT | Lintas APP + FW | Kontrak, fixture, integration acceptance |
| QA/HW | Fixture fisik + browser/OS | Acceptance, durability, usability, bukti |
| RELEASE | Maintainer kedua repo | Scope, go/no-go, version, release, rollback |

Lokasi APP/FW dapat berbeda antar mesin; semua path selanjutnya relatif terhadap aliasnya. Kepemilikan di tabel adalah peran, belum penunjukan nama orang.

### Milestone

| Gate | Arti | Tidak berarti |
|---|---|---|
| G0 — Scope disahkan | Board, fitur, kontrak dan klaim dukungan jelas | Implementasi selesai |
| G1 — Ready testing | Build kandidat reproducible, jalur dasar aman, paket pengujian dan fixture siap | Semua skenario hardware sudah PASS |
| G2 — Hardware/UAT accepted | Semua skenario wajib pada target rilis punya bukti fisik | Release publik sudah dilakukan |
| G3 — Ready production | G2 + security, dokumentasi, artefak, upgrade/rollback, CI dan persetujuan rilis | Semua board eksperimental otomatis supported |
| G4 — Production released | Artefak tervalidasi dipublikasikan, post-deploy smoke lulus | Tidak akan ada bug atau maintenance berikutnya |

## 2. Pekerjaan sebelumnya — inventaris berbukti

Batas inventaris: pekerjaan yang ditemukan dari kode sekarang, checkpoint studi, changelog, riwayat commit, dan rencana pada dua repo. Ini bukan klaim bahwa seluruh checklist lama sudah selesai. Hanya verifikasi sesi studi yang dicantumkan sebagai hasil eksekusi; full suite dan hardware tetap punya pekerjaan tersendiri di bawah.

### 2.1 Aplikasi yang sudah tersedia

- [x] **H-A01 — Struktur aplikasi Svelte/TypeScript/Vite tersedia.** Bukti: APP `package.json`, `src/App.svelte`, `src/main.ts`, `vite.config.ts`.
- [x] **H-A02 — Packet builder/parser VIA dan tabel keycode tersedia.** Bukti: APP `src/core/protocol.ts`, `commands.ts`, `keycodes.ts`, `crc.ts`; konsistensi ABI masih harus dituntaskan di C02/F03.
- [x] **H-A03 — Parser definition dan input JSON tersedia.** Bukti: APP `src/core/v3-definition.ts`, `src/App.svelte`; mendukung flat object key positions, bukan seluruh variasi JSON VIA/KLE.
- [x] **H-A04 — BLE transport, command queue, dan dispatcher tersedia.** Bukti: APP `src/ble/transport.ts`, `queue.ts`, `dispatch.ts`; reliability lengkap belum dibuktikan, lanjut A01.
- [x] **H-A05 — Protocol/version check dan pembacaan snapshot tersedia.** Bukti: APP `src/device/synchronizer.ts`; commit `4a64cb7` untuk jalur perangkat `0x000D` dan merge `b7efd11`. Identity/dimensi bukan otomatis tervalidasi oleh version check.
- [x] **H-A06 — State koneksi/sync/stale/save tersedia.** Bukti: APP `src/store/app.svelte.ts`; enforcement seluruh write path masih perlu A02/A04.
- [x] **H-A07 — Editor keymap, layer, dan pemilihan assignment encoder tersedia.** Bukti: APP `src/ui/keymap/`, `src/ui/encoder/EncoderEditor.svelte`; UI assignment tidak membuktikan putaran encoder fisik.
- [x] **H-A08 — UI lighting, layout, macro dan reset tersedia.** Bukti: APP `src/ui/lighting/LightingPanel.svelte`, `src/ui/layout/LayoutOptions.svelte`, `src/ui/macro/MacroEditor.svelte`, `src/ui/device/DeviceActions.svelte`. Lighting memiliki mismatch terkonfirmasi; macro execution belum tersedia di FW.
- [x] **H-A09 — Profile export/import dan apply serial tersedia.** Bukti: APP `src/store/profile.ts`, `src/ui/profile/ProfileManager.svelte`, `ProfileApplier.svelte`; validasi, dirty/persist dan hasil parsial belum lengkap.
- [x] **H-A10 — Responsive shell, onboarding, navigasi dan manual Indonesia tersedia.** Bukti: APP `src/App.svelte`, `src/ui/navigation.ts`, `src/ui/manual/`, commit `41755d2`, `35b198e`.
- [x] **H-A11 — Simulator VIA in-memory tersedia.** Bukti: APP `src/ble/simulator.ts`; tidak terhubung sebagai perangkat produksi dan bukan oracle firmware.
- [x] **H-A12 — CI/deploy, metadata OSS dan checklist visual tersedia.** Bukti: APP `.github/workflows/deploy.yml`, `LICENSE`, `SECURITY.md`, `CHANGELOG.md`, `docs/manual-visual-checklist.md`. Dukungan/version docs masih tidak konsisten.

### 2.2 Firmware yang sudah tersedia

- [x] **H-F01 — Core protokol VIA v13 tersedia.** Bukti: FW `src/VIA_Protocol.h/.cpp`; command keymap, macro buffer, encoder, layout, custom values, reset dan bootloader diproses.
- [x] **H-F02 — Storage interface, CRC record dan staging load tersedia.** Bukti: FW `src/VIA_Protocol.cpp` bagian `load`, `writeState`, `factoryReset`; schema version 2. Power-loss fisik belum diverifikasi sesi studi.
- [x] **H-F03 — Matrix scanning/debounce dan keyboard/layer/6KRO engine tersedia.** Bukti: FW `src/VIA_Matrix.h/.cpp`, `VIA_Keyboard.h/.cpp`, `VIA_Keycodes.h`; batas dimensi, modifier gabungan dan lifecycle tetap harus diverifikasi.
- [x] **H-F04 — RGBLight custom handler tersedia.** Bukti: FW `src/VIA_RGBLight.h/.cpp`; legacy channel `0x02` dan V3 IDs `0x80..0x83`; rendering LED merupakan callback board.
- [x] **H-F05 — Encoder, battery dan sleep helper tersedia.** Bukti: FW `src/VIA_Encoder.h`, `VIA_Battery.h`, `VIA_SleepMgr.h`; bukan bukti integrasi hardware selesai.
- [x] **H-F06 — RP2040 TinyUSB Raw HID/keyboard dan EEPROM adapter tersedia.** Bukti: FW `src/VIA_TinyUSB_RawHID.*`, `VIA_TinyUSB_Keyboard.*`, `VIA_EEPROMStorage.h`, contoh `RP2040_VIA_RawHID`.
- [x] **H-F07 — STM32F103 USB/flash/boot/GPIO adapter tersedia.** Bukti: FW `src/VIA_STM32F1_*`, contoh `STM32F103_Keyboard_MVP`; bukan hardware acceptance.
- [x] **H-F08 — ESP32/S3 NimBLE HID, FF60 transport, GPIO dan NVS adapter tersedia.** Bukti: FW `src/VIA_ESP32_*`, `VIA_ESP32S3_*`; commit `8ee97c3`, `ce0bea7`, `fefdeba`.
- [x] **H-F09 — Perbaikan shared NimBLE server dan pengiriman payload HID 9 byte tercatat.** Bukti: commit FW `ce0bea7`, `b34fb9a`, kode `VIA_ESP32_BLE.h`. Panjang payload bukan bukti descriptor dan penerimaan host sudah benar; lanjut F03.
- [x] **H-F10 — nice!nano v2/nRF52840 Bluefruit dan InternalFS adapter tersedia.** Bukti: FW `src/VIA_nRF52_*`, contoh `nice_nano_v2_VIA_BLE` beserta JSON definition.
- [x] **H-F11 — Native test sources, fake adapters, CI compile jobs dan utilitas hardware tersedia.** Bukti: FW `tests/`, `.github/workflows/ci.yml`, `.github/scripts/install-nice-nano-variant.sh`, `tests/hardware/`, `extras/nice_nano_storage_corruptor/`; belum berarti semua job diuji ulang lokal.
- [x] **H-F12 — Bukti compile nice!nano terdahulu terdokumentasi.** Bukti: FW `docs/nice-nano-v2-hardware-checklist.md`: SHA `dd22948`, BSP `1.7.0`, Actions run `31058754636`, hash UF2. Dokumen tersebut menyatakan physical hardware verification masih pending; artefak harus dibangun ulang untuk kandidat rilis baru.

### 2.3 Pekerjaan dan eksekusi sesi studi sebelumnya

- [x] **H-V01 — Arsitektur dua repo dan kontrak wire dasar dipetakan langsung dari kode.** Bukti: checkpoint `.cooper/context/repo-study.md`, FF60/FF61/FF62, 32-byte frame, big-endian keycodes dan chunk 28 byte.
- [x] **H-V02 — Dependency APP disiapkan dengan frozen lockfile.** Bukti sesi studi: `pnpm install --frozen-lockfile` exit 0, lockfile up-to-date.
- [x] **H-V03 — Static check APP dijalankan.** Bukti sesi studi: `pnpm check`, 371 files, 0 errors, 0 warnings.
- [x] **H-V04 — Build APP dijalankan.** Bukti sesi studi: `pnpm build`, 142 modules, exit 0.
- [x] **H-V05 — Smoke UI nyata dilakukan.** Bukti sesi studi: definition WROOM-32 dimuat, matrix 5×6 tampil, manual terbuka di Chrome terisolasi; tidak ada runtime error pada tindakan tersebut. Ini bukan audit semua halaman/mobile.
- [x] **H-V06 — Smoke modul aplikasi terhadap simulator dilakukan.** Bukti sesi studi: 3 layer, 90 keycodes, 6 encoder entries; set/get keycode menghasilkan `0x0006`.
- [x] **H-V07 — Core firmware asli dikompilasi dan dieksekusi melalui WSL.** Bukti sesi studi: g++ 13.3, `VIA_Protocol.cpp` + `VIA_RGBLight.cpp`; protocol=13, keymap read/write, commit channel02 dan reload MemoryStorage berhasil; exit 0. Bukan uji NVS/power-loss.
- [x] **H-V08 — Mismatch lighting direproduksi.** Bukti sesi studi: request APP `08 08 01` → FW `FF`; request legacy `08 02 01` → brightness 128 pada byte3. Ini temuan bug, bukan pekerjaan fix yang selesai.
- [x] **H-V09 — Service/browser dan smoke source sementara dibersihkan.** Bukti sesi studi: Vite service dihentikan, browser ditutup, C++ source/executable sementara dihapus; kode sumber tidak diubah.

## 3. Rekonsiliasi seluruh rencana lama

Rencana lama tetap disimpan sebagai sejarah. Dokumen ini menjadi indeks pekerjaan aktif; daftar unchecked di file lama tidak otomatis berarti kode belum ada. Langkah yang menghapus fitur untuk sementara, hardcoded mock, atau membuat implementation stub tidak dibawa sebagai deliverable produksi.

| Sumber terdahulu | Pekerjaan yang dibawa ke roadmap aktif |
|---|---|
| APP `docs/superpowers/plans/2026-08-03-airvia-reliability-and-product-plan.md` | Queue/correlation, input safety, snapshot, connect/dirty, keymap, profile, UX, feature verification dan hardening → C01–C05, A01–A10, I01–I04, T01–T08, R01–R08 |
| APP `docs/superpowers/plans/2026-08-03-airvia-reliable-keymap-plan.md` | ACK edits, modal accessibility, keyboard navigation, sizing dan workflow → A04, A10, I02, T01/T07 |
| APP `docs/superpowers/plans/2026-08-03-airvia-product-shell-plan.md` | Theme, profile schema/import/export, navigation shell → A07, A10, T07 |
| APP `docs/superpowers/plans/2026-08-03-airvia-verified-features-plan.md` | Encoder picker, lighting debounce, layout flags, unavailable guards → A05/A06, F04/F06, T04 |
| APP `docs/superpowers/plans/2026-08-03-airvia-public-hardening-plan.md` | Tooling, CI, docs/capability claims → P02, I04, R01/R02/R05 |
| APP `docs/superpowers/plans/2026-08-04-airvia-final-stabilization-plan.md` | Identity, profile safety, macro diagnostics, release metadata → C04, A07/A08, R01/R02 |
| APP `docs/superpowers/plans/2026-08-04-airvia-v1-rc-implementation-plan.md` | Session, correlation, simulator, full sync, feature round trips, profile, RC gate → A01–A09, C03, I01–I04, G1 |
| APP `docs/superpowers/plans/2026-08-04-dark-control-room-user-manual-plan.md` | Typed navigation, responsive shell, onboarding, canvas, manual/search, accessibility → A10, T07, R02 |
| FW `docs/superpowers/plans/2026-08-01-protocol-correctness.md` dan `docs/superpowers/plans/2026-08-01-protocol-correctness-final-fixes.md` | Bounds, matrix packing, reset isolation, custom save/state, CRC/staging, boot response completion, TinyUSB lifetime → C01/C03/C05, F01/F05/F07, I03, T05/T06 |
| FW `docs/superpowers/plans/2026-08-01-stm32f103-keyboard-mvp.md` | Matrix direction/debounce, key engine/layers, HID retry, USB/flash/boot integration → F01–F03, F05/F07, T01/T05/T06/T08 |
| FW `docs/superpowers/plans/2026-08-02-airvia-implementation.md` | Seluruh fondasi APP: scaffold, CRC/keycodes, definition, protocol, queue/BLE, store, shared UI, keymap/encoder/macro/lighting/layout/console/root → H-A01–H-A12; perbaikan sisa melalui C01–C05 dan A01–A10 |
| FW `docs/superpowers/plans/2026-08-02-esp32s3-wireless-via-keyboard.md` | Encoder/battery/sleep, GPIO/NVS, USB, BLE HID dan sketch → F02–F07, T01/T04/T05/T06/T08 |
| FW `docs/superpowers/plans/2026-08-02-airvia-ble-transport.md` | FF60/FF61/FF62, sketch dan API docs → C01, F07, T02, R02 |
| FW `docs/superpowers/plans/2026-08-05-nice-nano-v2-airvia-ble.md` | GPIO/HID, Bluefruit transport, durable FS, example/definition, pinned compile dan metadata → F02/F03/F05/F07, I04, T02/T05/T08, R03 |
| FW `docs/superpowers/plans/2026-08-05-nice-nano-ci-hardware-acceptance.md` | Full FS write verification, invalid packets, BLE-only example, utilities, UF2/hash, compile evidence dan physical acceptance → F05/F07, I03/I04, T02/T05/T08, R03 |
| APP `docs/superpowers/specs/2026-08-03-airvia-product-roadmap-design.md` | Local drafts/recovery, identity-bearing profiles, rename/duplicate, diff/apply/persist/verify → C04, A07/A09. Deliberate deferrals tetap dicatat di bagian 14. |

## 4. Temuan aktif dan prioritas

`Terkonfirmasi kode` berarti implementasinya terbaca, bukan gejala hardware sudah direproduksi. `Perlu pembuktian` harus diuji sebelum menyatakan bug atau menerapkan fix.

| ID | Prioritas | Status bukti / masalah | Pemilik / pekerjaan |
|---|---|---|---|
| GAP01 | P0 | Terkonfirmasi runtime: lighting channel/offset APP berbeda dari FW; simulator menerima konvensi lain | INT → C03, A05, I01 |
| GAP02 | P1 | Terkonfirmasi kode: WROOM/S3 membuang encoder delta; remap map tidak menghasilkan aksi encoder fisik | FW → F04 |
| GAP03 | P1 | Terkonfirmasi kode: macro FW storage-only, APP memberi editor teks; zero count dan unsupported perlu dibedakan | INT → F06, A08 |
| GAP04 | P0 | Terkonfirmasi kode: profile parser minim validasi; apply bisa partial, tidak commit/verify dan tidak menandai dirty di jalur apply | APP → A07 |
| GAP05 | P0 | Terkonfirmasi kontrak: FF62 hanya version/name; version check bukan VID/PID/matrix identity check | INT → C04, A02/A03 |
| GAP06 | P0 | Perlu pembuktian: response hanya cocok berdasarkan command; timeout exhaustion tidak memanggil flush request berikutnya; race notify/write completion dan late response | APP → A01 |
| GAP07 | P0 | Terkonfirmasi kode: QK_MODS helpers belum dipakai builder report; ESP32 descriptor modifier usage minimum E2, bukan E0; default keycodes media contoh berbeda dari APP | FW/INT → C02, F03 |
| GAP08 | P0 | Terkonfirmasi kode: parser APP mengizinkan 32 row, tetapi Matrix `prevRaw_[8]` dan Keyboard `savedChanged[8]`; validasi harus mendahului akses buffer | FW/INT → F01, C04 |
| GAP09 | P0 | Perlu pembuktian: startup return dari setup masih diikuti loop; COL2ROW input pullups, pemanggilan scan di reference sketch, pin strapping/flash perlu ditelusuri | FW → F02 |
| GAP10 | P1 | Perlu pembuktian: contoh S3 menggunakan `!matrix.hasChanged()` setelah keyboard mengonsumsi perubahan; satuan ADC/calibration dan save-before-sleep perlu diperiksa | FW → F02/F05/F07 |
| GAP11 | P1 | Terkonfirmasi dokumen: package 1.0.0, README/manual RC; FW experimental; engines APP berbeda dari CI Node22/pnpm11 | RELEASE → P02, R01/R02 |
| GAP12 | P0 | Bukti belum tersedia: acceptance fisik, durability, otorisasi write BLE, upgrade/rollback dan soak untuk target rilis | QA/HW/INT → S01–S04, T01–T08, R04 |

### Status bench WROOM setelah diagnosis direct-pin

- [x] **WB01 — Root cause matrix dibuktikan dan diperbaiki.** Adapter GPIO ESP32 membalik input sebelum scanner membalik active-low lagi; regresi idle gagal sebelum fix (exit134), lulus setelah fix. Logical idle yang benar `0`, GPIO4–GPIO16 pressed `0x02`. Nilai lama `0x3f/0x3d` hanya bukti perubahan listrik, bukan logical keyboard PASS.
- [x] **WB02 — Framing generic BLE HID diperbaiki.** HOGP notification 8 byte tanpa report-ID prefix; modifier descriptor E0..E7; test press/release serta jalur GPIO→matrix→keyboard→BLE lulus, termasuk ASan/UBSan. Bukti pada FW `docs/testing/esp32-wroom-2026-10-20.md`.
- [x] **WB03 — Kandidat keyboard WROOM tanpa strapping GPIO ter-flash.** Rows `{4,19,23,13,14}`, columns `{27,16,17,18,21,22}`; compile flash624135/RAM39660, upload COM39 hash verified, serial ready, BLE1812+FF60 di native identity `24:6F:28:A0:DB:36`. VIA13 dan read-only R0/C1 `0x0011` dibaca dari perangkat nyata; NVS tidak direset.
- [x] **WB04 — Basic keyboard host smoke (manual user confirmation).** 2026-10-25: pengguna menyatakan change keymap dan key press fisik berfungsi pada fixture WROOM saat ini. Ini bukti manual pengguna, bukan automated source-specific HID trace; posisi/jumlah tombol dan timing key-up tidak dilaporkan. Acceptance semua switch, release/stuck-key, modifier/rollover dan produksi tetap terbuka.
- [x] **WB05a — Bootstrap OTA tersedia dan ter-flash.** ArduinoOTA berpassword terpisah, serial provisioning/NVS terpisah, host credential Windows; config-parser ASan/UBSan dan tiga host tests PASS. Build flash1226171/RAM64756, upload COM39 hash verified; image MD5 `a1c9d387e755314eccab5cb8b4a047c4`, slot `app0`.
- [x] **WB05 — Wi-Fi OTA bench end-to-end.** 2026-10-25: SSID `IOTech1`, IP `192.168.1.103`; password salah ditolak (`Authentication Failed`, exit1). Upload `.ino.bin` lewat IP selesai `OTA_UPLOAD_OK`, exit0/54.90s; reboot pindah `app0 -> app1`, image MD5 cocok. Post-OTA VIA13 dan keymap NVS0x0011 tetap benar. Ini smoke transfer image yang sama, bukan sertifikasi migration/power-loss/rollback produksi. Password tidak masuk repo/log/checklist.
- [x] **WB07 — VIA UI reversible remap smoke.** 2026-10-25 17:44: Chrome Web Bluetooth memilih ESP32 nyata24:6F:28:A0:DB:36; Ready/VIA13/3 layer/90 keycodes. Full180-byte read cocok dengan UI. Picker L0/R0/C1 N0x0011→A0x0004, ACK/readback, Save09_02, reconnect/full sync hanya target itu berubah; encoder/layout tetap. RestoreN, Save, readback semua90 keycodes dan reconnect kedua cocok backup; Ready/0 pending/no page errors. Ini satu kasus bench, bukan100-case remap acceptance, physical typing atau power-cut durability.
- [ ] **WB06 — Production gates tetap terbuka.** Hentikan sweep semua pin sesuai arahan pengguna; ini tidak menghapus full-matrix, security, durability, reconnect/soak atau sign-off rilis dari backlog.


## 5. Scope, target dan urutan kerja

### Pendekatan yang dipilih untuk rencana

Pilihan konservatif: selesaikan satu jalur WROOM-32 end-to-end terlebih dahulu, buktikan kontrak bersama, lalu jalankan penerimaan per target. Alternatif mengerjakan semua board serentak memperbesar permukaan diagnosis; alternatif hanya memoles APP meninggalkan risiko HID/storage. Tidak ada board atau fitur yang otomatis dihapus dari backlog.

Target produk lama **3–5 keyboard terverifikasi** dipertahankan sebagai rencana gate rilis awal, minimal 3 konfigurasi keyboard/definition yang benar-benar berbeda. Ini bukan 3 flash ulang board yang sama. Identitas target final wajib disahkan melalui P01; pengurangan target memerlukan keputusan eksplisit dan revisi klaim produk.

| Target | Jalur konfigurasi / typing | Pekerjaan tersisa | Aturan dukungan |
|---|---|---|---|
| ESP32 WROOM-32 | AirVIA BLE / BLE HID | Jalur pertama: identity, matrix/HID, encoder, persistence, recovery/security | Kandidat utama; belum hardware accepted |
| nice!nano v2 / nRF52840 | AirVIA BLE / Bluefruit HID | Bangun ulang UF2; checklist fisik dan storage corruptor | Bukti compile lama saja, bukan bukti produksi |
| ESP32-S3 | AirVIA BLE dan/atau USB sesuai mode yang diuji / BLE atau USB HID | Mode routing, shared server, encoder, battery/sleep bila board mendukung | Setiap mode yang diiklankan diuji terpisah |
| RP2040 | USB Raw HID / USB keyboard | Reference sketch perlu integrasi physical matrix nyata dan host USB acceptance | AirVIA saat ini BLE-only; tidak menambah WebHID tanpa scope baru |
| STM32F103 | USB Raw HID / USB keyboard | Toolchain/size gate, scan loop, USB, flash, boot/recovery di board aktual | Tidak disebut AirVIA BLE-compatible tanpa transport yang benar-benar ada |
| AVR Uno | Protocol self-test | Compile portability dan footprint | Bukan keyboard production target hanya karena self-test berhasil |

Tidak mewajibkan LED, baterai atau macro pada board yang tidak memilikinya. Wajib menyatakan capability tersebut unavailable dan tidak mengiklankannya. Untuk target yang menjanjikan fitur tersebut, work package dan acceptance terkait menjadi wajib; bukan disembunyikan untuk melewati gate.

Urutan dependensi: **P01/P02 + C01–C05 + desain S01 → G0 → F01–F07 dan A01–A10 beserta implementasi security S01/S02 → I01–I04 → G1 → T01–T08 + validasi S01–S04 → G2 → R01–R06 → G3 → R07/R08 → G4**. Work package dengan kontrak sama tidak boleh diedit paralel tanpa pemilik integrasi. Fase memakai nomor 0–5; label prioritas P0/P1/P2 berbeda: blocker keselamatan/data, fungsi wajib, dan isu non-blocking.

## 6. Fase 0 — Bekukan baseline dan kontrak bersama

### P01 — Scope dan acceptance ownership [RELEASE + QA/HW]

- [ ] Catat SHA awal kedua repo dan perbedaan lokal yang harus dipertahankan; jangan commit/stage perubahan pengguna tanpa diminta.
- [ ] Tetapkan 3–5 target awal, model/revisi PCB, definition, mode koneksi, OS/browser, firmware version dan pemilik fixture. Jangan menyamakan nama BLE dengan identitas model.
- [ ] Setujui matriks wajib per target: basic/modifier/layer, encoder, lighting, layout, macro execution, battery/sleep, reset/boot, dan persistence. Tandai tidak tersedia hanya jika benar-benar bukan fitur target.
- [ ] Tetapkan pemilik APP, FW, integration, hardware acceptance, security dan release; alokasikan fixture fisik, LED/encoder sesuai scope, alat flash serta pemutus daya aman.
- [ ] Sahkan kriteria kuantitatif bagian 10 sebelum menjalankan acceptance; perubahan setelah gagal harus punya alasan, bukan memutihkan hasil.

### P02 — Toolchain dan baseline reproducible [APP + FW]

**Files:** APP `package.json`, `pnpm-lock.yaml`, `.github/workflows/deploy.yml`; FW `.github/workflows/ci.yml`, `library.properties`.

- [ ] Jalankan dan simpan hasil baseline APP check, full test suite dan build pada SHA kandidat; pisahkan kegagalan yang sudah ada dari regresi.
- [ ] Jalankan native firmware suites, warnings-as-errors dan ASan/UBSan di Linux/WSL; compile semua contoh yang diklaim dalam scope.
- [ ] Selaraskan engines/package manager APP dengan versi yang benar-benar diuji di CI; CI sekarang Node22/pnpm11, bukan klaim kompatibilitas otomatis Node18/pnpm8.
- [ ] Pin versi core/library/tooling FW yang digunakan untuk release; pertahankan job portability terpisah jika ingin mendukung versi lain.
- [ ] Catat flash/RAM hasil compile, batas partisi/storage dan ruang cadangan target; build gagal jika melewati batas board, bukan hanya link berhasil.

### C01 — Spesifikasi wire dan command lifecycle [INT]

**Files:** APP `src/core/protocol.ts`, `commands.ts`, `ble/dispatch.ts`; FW `src/VIA_Protocol.h/.cpp`, `docs/API.md`.

- [ ] Dokumentasikan FF60/FF61/FF62, fixed 32 bytes, endian, chunk max28, request/response layouts, error FF, timeout, retry dan persistence per command dalam spesifikasi bersama.
- [ ] Tegaskan semantik read/write/ACK/commit/verify serta reset keymap vs macro reset vs factory reset dan boot response-completion; ulangi command non-idempotent hanya jika terbukti aman.
- [ ] Tentukan korelasi per command: subcommand, layer/row/col, encoder/direction, offset/size; zero padding jangan diperlakukan sebagai payload valid.
- [ ] Tetapkan perilaku malformed/unsupported/fatal transport failure, stale notification dan session disconnect tanpa menambah fallback yang mengklaim sukses.

### C02 — Keycode ABI dan encoder direction [INT]

**Files:** APP `src/core/keycodes.ts`, `src/store/app.svelte.ts`, `src/ui/encoder/EncoderEditor.svelte`; FW `src/VIA_Keycodes.h`, `VIA_Keyboard.cpp`, contoh WROOM/S3.

- [ ] Cocokkan tabel keycode ke ABI QMK yang dinyatakan FW dan HID usage pages; bedakan physical modifier, QK_MODS, keyboard usage, consumer/system, layer dan macro code.
- [ ] Buat vektor perilaku kiri/kanan modifier, kombinasi modifier+key, basic keys, MO/TG/TO/DF dan unsupported; hapus default contoh yang salah memetakan volume menjadi modifier.
- [ ] Tetapkan satu arti direction byte 0/1 dan CW/CCW di protocol, store, UI dan encoder runtime; buktikan dua arah menghasilkan assignment berbeda yang benar.
- [ ] Fitur media/system yang dijanjikan harus punya report/usage yang tepat; jangan mengirim consumer usage sebagai boot-keyboard key. Jika target tidak mendukung, UI harus menyatakan tidak tersedia sesuai P01.

### C03 — Kontrak RGB dan simulator sebagai cermin, bukan oracle [INT]

**Files:** APP `src/device/synchronizer.ts`, `src/core/protocol.ts`, `src/ble/simulator.ts`, `src/ui/lighting/LightingPanel.svelte`, `src/ui/profile/ProfileApplier.svelte`; FW `src/VIA_RGBLight.cpp`.

- [ ] Jadikan layout handler FW yang terdokumentasi referensi interoperability: legacy channel02 atau V3 IDs80..83 sesuai tipe capability; tidak mengasumsikan semua lighting memiliki lima channel independen.
- [ ] Selaraskan read/write offset dan hue+saturation berpasangan di synchronizer, slider, profile applier dan simulator; save tetap `09 02` untuk handler RGB legacy.
- [ ] Tambahkan golden packet cases dari proses FW nyata ke APP dan FW; buktikan brightness/effect/speed/HSV boundaries 0/255 dan save/reload, bukan hanya simulator menerima input APP.
- [ ] Capability lain seperti backlight/WT harus memakai handler yang terdefinisi dan diuji atau dinyatakan unavailable; enum parser bukan implementasi dukungan lighting.

### C04 — Device identity, dimensi dan capability [INT]

**Files:** APP `src/device/synchronizer.ts`, `src/core/v3-definition.ts`, `src/App.svelte`; FW `src/VIA_Protocol.h/.cpp`, BLE transports, example definitions.

- [ ] Rancang dan dokumentasikan metadata read-only minimal untuk model/definition identity, matrix, encoder count dan capability; tetapkan extension ID setelah mengecek benturan VIA v13. FF62 version/name tetap jangan ditafsirkan sebagai VID/PID.
- [ ] Nyatakan kebijakan legacy: mismatch pasti ditolak; identity tidak tersedia diberi status unverified dan tidak dianggap verified hanya karena version cocok. Kebijakan izin write legacy memerlukan keputusan eksplisit P01.
- [ ] Terapkan pemeriksaan dimensi/layer/encoder/buffer yang sama di APP dan FW sebelum alokasi/akses/write; cegah nilai byte/offset melampaui kapasitas representasi protokol.
- [ ] Bedakan unsupported command dari timeout, disconnect dan response malformed. Timeout tidak boleh diam-diam menonaktifkan fitur dan mengklaim sync lengkap.
- [ ] Batasi klaim versi pada versi yang diuji: current minimum APP adalah 0x000C, sedangkan target produk v13; uji v12 secara nyata atau tolak dengan pesan jelas, jangan hanya mengubah komentar.

### C05 — Persistence contract [INT]

**Files:** FW `src/VIA_Protocol.cpp`, storage adapters; APP `src/ui/ConnectBar.svelte`, `src/store/app.svelte.ts`, profile/macro/lighting write paths.

- [ ] Dokumentasikan scope commit, autosave debounce, failure behavior dan schema compatibility; ACK write RAM bukan durable-save confirmation.
- [ ] Tetapkan apa yang diverifikasi lewat readback sekarang dan apa yang hanya bisa dibuktikan setelah reset/power-cycle. UI tidak mengklaim ketahanan power-loss dari readback RAM.
- [ ] Definisikan recovery partial apply/save failure dan update schema tanpa menimpa backup pengguna; tidak menghapus storage atau reset factory sebagai fallback otomatis.

### G0 — Checklist SCOPE DAN KONTRAK DISAHKAN

- [ ] **G0-01:** Target, fitur wajib/unavailable, pemilik fixture dan kriteria acceptance P01 disahkan; batas klaim dukungan tidak ambigu.
- [ ] **G0-02:** Baseline/toolchain P02 dan kontrak C01–C05 tercatat; keputusan compatibility, identity dan persistence memiliki pemilik integrasi.
- [ ] **G0-03:** Threat model dan desain authorization S01 disetujui sebelum implementasi; rencana tidak bergantung pada akses write BLE terbuka untuk produksi.

## 7. Fase 1 — Lengkapi dan amankan firmware

### F01 — Matrix dan runtime bounds [FW, P0]

**Files:** FW `src/VIA_Matrix.h/.cpp`, `VIA_Keyboard.h/.cpp`, `VIA_Protocol.cpp`; tests `matrix_test.cpp`, `keyboard_test.cpp`, `protocol_test.cpp`.

- [ ] Reproduksi boundary rows 0/8/9/32, columns 0/32/33, null buffer dan ukuran keymap sebelum konstruktor menulis `prevRaw_[8]`; cocokkan dengan buffer `savedChanged[8]`.
- [ ] Validasi batas yang sungguh didukung sebelum akses; jangan diam-diam membatasi matrix dan salah menomori keymap. Pelebaran kapasitas hanya jika dibutuhkan target P01, tanpa heap di jalur scan.
- [ ] Uji COL2ROW/ROW2COL, pin input pullup, changed-row masks, debounce press/release, simultaneous keys dan timer wrap. Buktikan scan berjalan pada setiap reference keyboard.

### F02 — Startup, pin mapping dan example completeness [FW, P0]

**Files:** FW `examples/ESP32_WROOM32_VIA_BLE/`, `ESP32S3_VIA_BLE/`, `nice_nano_v2_VIA_BLE/`, `RP2040_VIA_RawHID/`, `STM32F103_Keyboard_MVP/`; GPIO/matrix adapters.

- [ ] Telusuri setup/loop seluruh contoh: initialization sukses, scan dipanggil tepat sekali, protocol task dan keyboard task terhubung; RP2040 bukan lagi instruksi "scan sendiri" bila dijadikan produk, STM32/nRF52 punya event scan nyata.
- [ ] Kegagalan storage/BLE/USB/protocol/keyboard initialization menghentikan operasi yang bergantung padanya; `return` dari setup saja tidak menjamin loop aman.
- [ ] Audit GPIO terhadap schematic dan varian board: flash/PSRAM pins, strapping, input-only pins, pullup, encoder pins dan polaritas diode; cocokkan komentar/pin table dengan kode.
- [ ] Hapus alamat BLE hardcoded yang menyebabkan dua perangkat berbagi identitas; gunakan identitas unik dan stabil yang disediakan platform serta uji dua unit bersamaan.
- [ ] Pastikan error initialization dilaporkan tanpa dereference service/null pointer yang belum valid; jangan menyembunyikan kegagalan dengan ready log.

### F03 — Key execution dan HID descriptor [FW, P0]

**Files:** FW `src/VIA_Keycodes.h`, `VIA_Keyboard.cpp`, `VIA_ESP32_BLE.h`, `VIA_ESP32S3_BLE.h`, `VIA_TinyUSB_Keyboard.*`, `VIA_nRF52_BLE.h`, `VIA_STM32F1_USB*`; HID/keyboard tests.

- [ ] Perbaiki QK_MODS agar key usage dan left/right modifier mask keduanya masuk report; uji kombinasi, release order, duplicate key dan mixed layer.
- [ ] Cocokkan ESP32 descriptor usage range modifier, report ID/reference, payload panjang dan host parsing. Uji Left Ctrl/Shift/Alt/GUI hingga Right GUI, bukan hanya byte count 9.
- [ ] Buktikan 1–6 tombol, >6 rollover, report retry saat endpoint busy, release-all, disconnect/reconnect dan suspend/resume tanpa stuck key.
- [ ] Implementasikan consumer/system reports hanya untuk fitur yang disahkan P01; update adapter yang mengiklankannya dan buktikan hasil di aplikasi host, bukan console firmware.
- [ ] Periksa seluruh platform terhadap keycode ABI sama; dokumentasikan host LED feedback dan remote wake yang memang belum didukung adapter tertentu.

### F04 — Encoder event → assigned action [FW, P1]

**Files:** FW `src/VIA_Encoder.h`, `VIA_Keyboard.h/.cpp`, WROOM/S3 sketches, `tests/encoder_test.cpp`, `tests/keyboard_test.cpp`.

- [ ] Ganti pembuangan `encDelta` dengan event melalui pipeline key execution yang sama; gunakan active layer/transparent semantics dan direction C02.
- [ ] Emit press/release atau consumer action sesuai assignment tanpa meninggalkan modifier/key aktif; jangan menimpa tombol matrix yang sedang ditekan.
- [ ] Uji CW/CCW, slow/fast rotation, bouncing, delta >1, pergantian layer, remap saat runtime, reconnect dan save/reset.

### F05 — Durable storage, reset dan sleep-save [FW, P0/P1]

**Files:** FW `src/VIA_Protocol.cpp`, `VIA_ESP32_NVS.h`, `VIA_nRF52_InternalFS.*`, `VIA_STM32F1_Flash.*`, `VIA_EEPROMStorage.h`; NVS/FS/flash/protocol tests.

- [ ] Buktikan CRC/schema/bounds validation non-mutating, read/write/commit/erase failures, required load workspace dan failed commit tetap dirty.
- [ ] Tentukan old-or-new recovery per backend: saat power-loss record valid terakhir dipertahankan atau recovery yang eksplisit dan terdokumentasi; dilarang menerima campuran keymap sebagai record valid.
- [ ] Uji nRF52 dual-slot corrupt-newest fallback dan full-payload write verification; jaga storage corruptor hanya alat acceptance, tidak terdistribusi sebagai firmware normal.
- [ ] Uji reset keymap tidak menghapus macro, macro reset tidak menghapus keymap, factory reset sesuai default custom handler, dan bootloader menunggu response selesai serta save sukses.
- [ ] Sebelum deep sleep, selesaikan pending write/HID release dan pastikan save sukses; kegagalan save tidak diteruskan sebagai sleep sukses yang membuang perubahan.
- [ ] Ukur/cek autosave tidak melakukan flash commit per scan/tombol, debounce save tidak menunda selamanya setelah input berhenti, serta documented storage endurance sesuai backend.

### F06 — Macro end-to-end [INT, P1]

**Files:** FW `src/VIA_Protocol.*`, `VIA_Keycodes.h`, `VIA_Keyboard.*`; APP `src/ui/macro/MacroEditor.svelte`, `src/core/keycodes.ts`; protocol/keyboard tests.

- [ ] Tetapkan format macro yang benar-benar didukung dan keycode trigger; minimal perilaku teks yang diminta produk, bukan klaim semua opcode QMK tanpa implementasi.
- [ ] Implementasikan runner non-blocking dan bounded, memakai jalur HID yang sama; validasi terminator/length/opcode sebelum eksekusi, cancel/release saat disconnect/suspend.
- [ ] Uji slot kosong/terakhir, buffer penuh, malformed/truncated data, unsupported opcode dan tombol matrix bersamaan; jangan membaca keluar buffer atau memproduksi key yang tertahan.
- [ ] Bila target rilis tidak menjanjikan macro execution, tampilkan storage diagnostic/read-only dan label batasnya. Mengeluarkan macro dari fitur rilis yang sebelumnya disepakati harus disetujui, bukan auto-centang item ini.

### F07 — BLE/USB lifecycle dan battery/sleep integration [FW, P0/P1]

**Files:** FW `src/VIA_ESP32_BLE_ViaTransport.*`, `VIA_nRF52_BLE_ViaTransport.*`, USB adapters, `VIA_Battery.h`, `VIA_SleepMgr.h`, S3/nRF52 examples; adapter tests.

- [ ] Uji satu shared server, ownership callback, notification subscription/unsubscription, max packet len dan disconnect cleanup; paket sesi lama tidak diterapkan ke koneksi baru.
- [ ] Buktikan FF61 32-byte transfer membutuhkan MTU yang memadai atau gagal jelas; jangan mengubah frame size menjadi20 secara diam-diam. Uji traffic HID dan konfigurasi bersamaan.
- [ ] Isolasi dua central/perangkat sesuai kebijakan otorisasi, dropped pending request dan retry/backpressure; jangan mengirim hasil command ke peer yang salah.
- [ ] Uji USB Raw HID registration/lifetime, sendComplete dan mode USB/BLE S3 tanpa pemrosesan packet dua kali; mode yang tidak diuji tidak dipromosikan.
- [ ] Untuk board baterai: kalibrasi ADC/divider/satuan mV terhadap pengukuran nyata; battery level yang dipublikasikan bukan angka100 tetap jika diklaim monitoring.
- [ ] Perbaiki activity/sleep semantics setelah perubahan matrix dikonsumsi; buktikan tidak tidur saat mengetik, konfigurasi atau macro aktif, lalu wake/reconnect dan key-release tetap benar.

## 8. Fase 2 — Kebenaran aplikasi, sesi dan workflow

### A01 — Satu command path yang tidak macet [APP, P0]

**Files:** APP `src/ble/queue.ts`, `dispatch.ts`, `transport.ts`; existing queue/dispatch/transport tests.

- [ ] Reproduksi dan perbaiki timeout exhaustion agar request berikutnya diproses atau seluruh sesi gagal secara eksplisit; tidak ada Promise tertinggal tanpa akhir.
- [ ] Terapkan matcher C01, validasi panjang/frame/subcommand/offset, response FF dan unrelated/late notification; response request lama tidak menyelesaikan request baru.
- [ ] Uji notify datang sebelum write promise selesai, write rejection, duplicate callback, queue penuh, retry deadline, disconnect dan reconnect. Jangan mengklaim exactly-once untuk protokol tanpa request ID.
- [ ] Hentikan replay command destruktif yang tidak aman diulang; setelah hasil ambigu, re-read state atau minta recovery, bukan menganggap write pasti gagal.
- [ ] Bersihkan listener/timer/queue di setiap exit dan log TX/RX pada boundary nyata; packet console bukan hanya RX atau API logging yang tidak dipakai.

### A02 — Lifecycle dan write guards [APP, P0]

**Files:** APP `src/App.svelte`, `src/store/app.svelte.ts`, `src/ble/dispatch.ts`, seluruh editor dan device actions.

- [ ] Satu guard bersama menolak mutasi sebelum definition valid, compatible/authorized session, connected, sync ready dan capability writable; jangan hanya mengandalkan disabled button.
- [ ] Publish snapshot dan ready hanya setelah mandatory data lengkap dan snapshot masuk store; kegagalan mempertahankan state lama sebagai stale/read-only, bukan tampak synced.
- [ ] Lindungi connect/readInfo/sync/disconnect/replace-definition dari balapan dan promise rejection; koneksi baru membatalkan hasil sync lama.
- [ ] Reset selected target, active-layer bounds, macro buffer, capability dan pending timers saat sesi berganti; jangan mengirim draft/slider ke perangkat lain.
- [ ] Jalankan kedua urutan load/connect yang memang ditawarkan UI; apabila connect wajib setelah load, tombol dan manual menyatakan prasyarat yang sama.

### A03 — Input boundary, definition dan sync [APP, P0]

**Files:** APP `src/core/v3-definition.ts`, `src/device/synchronizer.ts`, `src/App.svelte`, `public/v3-examples/`.

- [ ] Validasi finite coordinates termasuk rotation origins, bounds/collection size, hex VID/PID, encoder count dan total keymap bytes sebelum UI/command allocation.
- [ ] Perjelas format flat object yang diterima. Untuk upstream VIA/KLE, putuskan importer terbatas dengan fixtures nyata atau rejection eksplisit; jangan mengklaim semua V3 JSON kompatibel.
- [ ] Terapkan identity/matrix C04 dan validate tiap keymap/macro/encoder/lighting response termasuk expected size/offset, u16 parity dan range; metadata salah membatalkan sync.
- [ ] Nilai layer/encoder/macro count0, unsupported dan transport failure dibedakan; fitur optional tidak dipalsukan dengan defaults atau disenyapkan saat timeout.
- [ ] Cocokkan seluruh example definitions dengan firmware target nyata; pin definisi yang dipakai tiap release.

### A04 — ACK, dirty, Save dan verification [APP, P0]

**Files:** APP `src/ui/keymap/KeycodePicker.svelte`, `src/ui/ConnectBar.svelte`, `src/store/app.svelte.ts`, all mutating editors.

- [ ] Update authoritative state setelah ACK/readback yang cocok, tampilkan failure ke pengguna dan sediakan retry aman; console.error saja tidak cukup.
- [ ] Track pending/failed/dirty per operation atau fitur sesuai kebutuhan nyata; pending write tidak boleh hilang bila Save ditekan sebelum ACK.
- [ ] Save melakukan commit sesuai C05, memisahkan applied/committed/verified, mempertahankan edit selama save dan tidak menandai semua perubahan tersimpan saat ada failure.
- [ ] Uji reset keymap: state/UI direfresh atau sengaja stale sampai resync; tidak membiarkan tampilan lama tetap editable sebagai data perangkat baru.

### A05 — Lighting round trip [APP, P0]

**Files:** APP `src/ui/lighting/LightingPanel.svelte`, synchronizer/protocol/profile applier, simulator dan lighting tests.

- [ ] Implementasikan C03 pada semua caller; slider memakai channel/sub/value yang benar dan hue/saturation ditulis sebagai pasangan yang disepakati.
- [ ] Debounce 150ms tidak mengirim stale write setelah disconnect, ganti definition atau profile apply; pending writes settle sebelum Save.
- [ ] Tampilkan failure dan nilai authoritative; control unavailable tetap read-only. Read→edit→commit→read→reconnect menggunakan FW nyata harus memberi nilai sama.

### A06 — Encoder dan layout [APP, P1]

**Files:** APP `src/ui/encoder/EncoderEditor.svelte`, `src/ui/layout/LayoutOptions.svelte`, `src/core/commands.ts`, `src/store/app.svelte.ts`.

- [ ] Selaraskan direction/indexing C02 saat sync, tampil, edit dan import profile; jangan menukar label CW dan CCW.
- [ ] Pertahankan layout uint32 unsigned, termasuk bit31 dan nilai `0xFFFFFFFF`; jangan menampilkan signed negative hex.
- [ ] UI menyediakan named options bila definition punya labels, raw flags sesuai 32-bit contract dengan warning yang tepat; bit tidak didukung target tidak ditawarkan sebagai fungsi nyata.
- [ ] Semua perubahan memakai guard/ACK/dirty yang sama, readback dan error state terlihat.

### A07 — Profiles lengkap, valid dan recoverable [APP, P0/P1]

**Files:** APP `src/store/profile.ts`, `src/ui/profile/ProfileManager.svelte`, `ProfileApplier.svelte`, `src/store/app.svelte.ts`; profile tests.

- [ ] Schema profile memuat version, keyboard/definition identity, matrix/layers, capability, name/timestamps, keymap, encoder, lighting/layout dan macro bila didukung; jangan ekspor secrets atau packet logs.
- [ ] Validasi tipe/nilai integer u16, panjang array, lighting byte ranges, unsigned layout, ukuran file dan nested data sebelum write; input salah harus ditolak tanpa satu pun command mutasi.
- [ ] Berikan kompatibilitas eksplisit untuk format profile v1 yang sudah ada: import/normalisasi aman atau penolakan jelas tanpa menimpa file asli; jangan silent truncate/skip keymap yang tidak cocok.
- [ ] Tambahkan penyimpanan profile lokal, rename/duplicate, export/import dan daftar profile sesuai product roadmap; gunakan browser storage sederhana, tanpa cloud/dependency baru.
- [ ] Tampilkan diff aktual keymap/encoder/lighting/layout/macro serta unsupported/conflicting values sebelum apply; no-op tidak mengirim write.
- [ ] Apply serial dengan progress; stop saat disconnect/identity berubah/fatal failure, laporkan subset berhasil dan dirty state, commit lalu verify sesuai pilihan pengguna. Jangan menulis "Partial state saved" hanya karena ACK RAM.
- [ ] Uji edit saat apply/save, invalid profile, wrong keyboard, kapasitas berbeda dan retry partial; tidak memutihkan perubahan yang belum ter-commit.
- [ ] Export → perubahan perangkat → import/apply → commit/readback → reset/power-cycle menghasilkan snapshot yang sesuai termasuk macro/capability yang diklaim.

### A08 — Macro UI sesuai kemampuan nyata [APP, P1]

**Files:** APP `src/ui/macro/MacroEditor.svelte`, synchronizer/protocol/store, keycode picker.

- [ ] Bedakan count0, unsupported, raw diagnostic dan supported editable format; jangan menganggap leading NUL sebagai standar tanpa kontrak F06.
- [ ] Editor memvalidasi encoding, terminator, byte capacity dan seluruh slot; chunk write dipadukan dengan ACK/failure/dirty/commit/readback, bukan langsung `markSaved()`.
- [ ] Bila runner target siap, sediakan trigger assignment yang benar dan uji hasil pengetikan. Bila runner belum siap, editor executable tidak diklaim didukung; keputusan scope dicatat di P01.

### A09 — Draft dan disconnect recovery [APP, P1]

**Files:** APP `src/store/app.svelte.ts`, `src/store/profile.ts`, `src/App.svelte`, profile/recovery UI.

- [ ] Simpan draft lokal terpisah dari authoritative snapshot dan durable-saved state, dibatasi ukuran dan terikat identity/definition.
- [ ] Setelah reload/disconnect, tampilkan resume/discard/re-sync; jangan otomatis replay ke perangkat baru atau snapshot yang berbeda.
- [ ] Tangani storage disabled/quota/corrupt JSON dengan pesan tanpa kehilangan file backup atau menghalangi editor read-only; browser non-BLE tetap bisa definition/profile/manual.

### A10 — UX, accessibility dan manual [APP, P1]

**Files:** APP `src/ui/shared/Modal.svelte`, `BrowserCheck.svelte`, navigation/keymap/manual components, `src/app.css`, `docs/manual-visual-checklist.md`.

- [ ] Jalankan checklist visual lama pada 1440×900 dan 390×844; semua destination reachable, keymap overflow/zoom sesuai scope, mobile more sheet dan dialog tidak menutupi kontrol utama.
- [ ] Uji keyboard navigation, focus trap/restore, Escape, screen-reader labels/live status, contrast AA, target sentuh 44px dan reduced motion; gunakan komponen modal yang sudah ada untuk profile dialog.
- [ ] Verifikasi empty/connecting/syncing/ready/pending/failed/stale/read-only/unavailable states di semua mutating page; unsupported browser tidak kehilangan workspace offline.
- [ ] Perbarui manual Indonesia agar load/connect, Save/persistence/verify, profile recovery, format definition, fitur per target dan troubleshooting sama dengan kode.

## 9. Fase 3 — Bukti integrasi dan Gate G1: Ready testing

### I01 — Contract fixtures dari firmware nyata [INT]

**Files:** existing APP core/synchronizer/simulator tests, FW `tests/protocol_test.cpp`, `tests/keyboard_test.cpp`; **Create** fixture records pada folder test yang mengikuti konvensi repo.

- [ ] Rekam request/response dari FW core nyata untuk version, info, layer/keymap chunks, encoder, layout, RGB, macro, commit/reset dan error; jangan menghasilkan expected data dengan implementation APP yang diuji.
- [ ] Pastikan decoder APP memakai frame sama dengan FW, simulator menolak request invalid yang FW tolak, dan fixtures menangkap mismatch GAP01/GAP07.
- [ ] Tambah edge cases yang memberi bug consumer-visible: wrong offset/subcommand, truncated frame, final chunk, bit31, zero capabilities, bounds, old/new schema dan stale session.

### I02 — Browser workflow nyata [APP + INT]

- [ ] Jalankan aplikasi nyata di Chrome/Edge dengan simulator atau fake GATT hanya sebagai fixture otomatis; pakai UI untuk load/connect/sync/edit/profile/save/reconnect, bukan hanya memanggil setter store.
- [ ] Reproduksi failure path: permission cancel, service hilang, MTU/notification gagal, wrong definition, readInfo gagal, write timeout, partial profile dan disconnect di tengah apply/save.
- [ ] Observasi bahwa UI tidak false-ready/false-saved, semua Promise settle, pengguna dapat retry/recover dan tidak ada console exception tak tertangani.
- [ ] Audit existing tests yang hanya mock echo/source-text/wording; hapus test incidental tersebut, ganti hanya bila ada perilaku nyata yang perlu dilindungi. Test count bukan target release.

### I03 — Firmware regression dan sanitizer [FW]

- [ ] Jalankan protocol, matrix, keyboard, encoder, battery, sleep, descriptor, flash, TinyUSB, nRF52 dan ESP32 native suites pada candidate SHA dengan flags CI; semua mandatory test exit0.
- [ ] Jalankan ASan/UBSan yang relevan, stress malformed packets dan storage failure injection; tidak ada invalid access, UB atau state corruption.
- [ ] Pertahankan deterministic/fake isolated fixtures dan upgrade tests yang menangkap behavior, bukan kontrak source-text yang tidak membuktikan runtime.

### I04 — CI lintas repo dan testing package [APP + FW + RELEASE]

- [ ] PR APP menjalankan install frozen, check, test, build; PR FW menjalankan lint/native/sanitizer dan compile target yang diklaim. Koreksi branch triggers/required checks berdasarkan branch aktual.
- [ ] Tambahkan integration gate yang mem-pin SHA APP/FW/definitions dan fixtures kompatibel; perubahan salah satu sisi tidak boleh lolos hanya karena suite repo sendiri hijau.
- [ ] Terbitkan paket kandidat testing: APP dist/preview, firmware per board, hashes, definition, toolchain lock, langkah flash/recovery, known issues dan formulir acceptance. Tidak membundel corruptor sebagai image default.
- [ ] Siapkan fixture dan alat di P01, backup pengguna/test storage terisolasi, cara merekam host input/latency dan cara disconnect/power-cycle tanpa risiko perangkat lain.

### G1 — Checklist keputusan READY TESTING

- [ ] **G1-01:** P01/P02 dan C01–C05 selesai; target/capability/identity/persistence tertulis dan disetujui.
- [ ] **G1-02:** Seluruh prioritas P0 yang memengaruhi target testing ditutup dengan regression evidence, termasuk implementasi authorization/validation S01/S02; tidak ada risiko korupsi, unauthorized mutation atau startup crash yang sudah diketahui tetapi diabaikan.
- [ ] **G1-03:** F01–F07/A01–A10 selesai untuk fitur kandidat, atau capability yang memang tidak menjadi fitur target dinyatakan unavailable sesuai P01; fitur yang dijanjikan tidak ditunda diam-diam.
- [ ] **G1-04:** I01–I04 PASS pada SHA kandidat; full check/test/build/compile dan browser smoke tercatat. Smoke simulator dan host FW dicatat terpisah dari hardware.
- [ ] **G1-05:** Firmware ter-flash minimal pada bench target awal, advertisement/USB enumeration serta protocol handshake diamati; ini hanya sanity check sebelum acceptance lengkap.
- [ ] **G1-06:** Paket testing, matriks test, pemilik fixture, log format, known issues, backup dan recovery siap; kandidat ditandai testing/RC, bukan stable.

## 10. Fase 4 — Physical hardware acceptance dan UAT

Kriteria berikut adalah **usulan minimum untuk disahkan P01**, bukan hasil yang sudah didapat atau standar industri. Jalankan per kombinasi board/revisi/mode/browser/OS yang diiklankan; catat timeouts/lost reports, bukan sekadar keberhasilan retry terakhir.

| Skenario | Minimum kandidat release | Syarat lulus |
|---|---|---|
| Connect/sync/reconnect | 50 siklus per target, mencakup Chrome dan Edge di Windows | Tidak macet; tiap siklus berhasil atau failure jelas dan recovery teruji; 0 false-ready/false-saved |
| Remap/persist | 100 perubahan lintas layer/posisi termasuk boundary | Readback benar, efek typing benar, tidak mengubah assignment lain |
| Reset/power-cycle | 20 reset dan20 pemutusan daya, mati minimal10 detik | Semua committed changes bertahan; uncommitted dijelaskan sesuai kontrak |
| Failure injection storage | 10 percobaan interrupt/corruption terkontrol per backend yang diklaim durable | Record valid lama/baru atau recovery terdokumentasi; tidak menerima state campuran sebagai valid |
| Encoder bila didukung | 100 detent tiap arah pada minimal2 layer | Arah/assignment benar, press/release lengkap, tidak ada stuck key |
| Macro/lighting/layout bila didukung | Empty/min/max dan10 round trips per fitur | State dan output fisik sesuai setelah save/reconnect/power-cycle |
| HID stability | 1–6 keys, >6 rollover, seluruh modifier, QK_MODS, layer chords | Report sesuai descriptor, key-up lengkap, tidak ada ghost/stuck key akibat firmware |
| Soak | 24 jam mixed typing/configuration/idle/reconnect per target | 0 crash, stuck key, corruption, unauthorized write atau queue stall; resource trend tercatat |

### T01 — Typing dan matrix acceptance [QA/HW]

- [ ] Catat wiring/diode direction dan uji setiap switch, posisi terakhir, layer, modifier kiri/kanan, QK_MODS, rapid press/release, debounce dan multi-key rollover di host input capture.
- [ ] Uji tombol ditahan selama remap/layer switch/disconnect/sleep; release tidak hilang dan remap tidak mengeksekusi key lama pada press berikutnya.
- [ ] Ukur scan/debounce/report latency dengan alat yang tersedia; rekam p50/p95/p99 dan tetapkan target yang disahkan sebelum acceptance final, terpisah dari waktu sync BLE.

### T02 — BLE dan USB connectivity acceptance [QA/HW]

- [ ] Uji fresh pairing, OS bond lama, hapus/recreate bond, browser permission cancel/revoke, koneksi ganda yang diizinkan dan dua unit model sama; identity tidak bertabrakan.
- [ ] Uji FF60 discovery, notifications, 32-byte traffic/MTU, HID+config simultan, radio terputus dan reconnect sesuai matriks di atas.
- [ ] Kirim FF61 length0/20/31/33 dan oversized packets melalui utilitas acceptance; traffic valid berikutnya tetap sehat dan keymap tidak berubah oleh input invalid.
- [ ] Untuk mode USB, uji enumeration ulang, suspend/resume, busy endpoint, unplug/replug dan bootloader response completion; jangan mencentang jalur USB dengan hasil BLE.

### T03 — Identity dan sync safety acceptance [QA/HW]

- [ ] Uji definition target benar dan salah matrix/model/encoder/version; mismatch pasti tidak mengirim write, unverified ditampilkan sesuai kebijakan.
- [ ] Cek snapshot lengkap dan data authoritative setelah sync; optional feature unsupported berbeda dari timeout/failure.
- [ ] Lakukan 100 remap/readback/typing cases, Save dan reconnect sesuai tabel; buktikan UI, buffer FW dan pengetikan host konsisten.

### T04 — Feature round trips [QA/HW]

- [ ] Encoder: uji arah/layer/detent, remap, save dan power-cycle terhadap output host, bukan hanya register encoder map.
- [ ] Lighting: amati LED fisik atau callback fixture yang memang mewakili driver target, brightness/effect/speed/HSV, paired HSV, debounce dan save/reload.
- [ ] Layout: uji opsi yang punya efek pada target dan raw32-bit preservation; opsi tanpa efek fisik tidak dipromosikan sebagai fitur jadi.
- [ ] Macro: trigger slot yang diprogram, output teks/sequence sesuai kontrak, capacity/error/cancel dan persistence; storage-only bukan macro execution PASS.

### T05 — Storage/reset/recovery acceptance [QA/HW]

- [ ] Jalankan reset/power-cycle dan failure injection sesuai tabel dengan backup; verifikasi committed snapshot, dirty failure dan pemulihan sesudah brownout/power interruption.
- [ ] Jalankan corrupt-newest-slot nice!nano pada fixture disposable sesuai `FW/docs/nice-nano-v2-hardware-checklist.md`; pulihkan firmware normal setelah selesai.
- [ ] Uji explicit reset keymap/macro/factory reset/bootloader hanya saat authorized, pastikan scope tidak meluas dan update tidak menghapus config tanpa pemberitahuan.

### T06 — Battery, suspend/sleep dan long run [QA/HW]

- [ ] Untuk target baterai, ukur tegangan nyata, ADC mapping dan level rendah; cek sleep current/wake source terhadap spesifikasi board, bukan asumsi generic library.
- [ ] Uji idle timeout, activity mengetik/encoder/macro/config, save gagal, pending ACK, wake dan reconnect; tidak tidur sebelum state aman.
- [ ] Jalankan soak 24 jam sesuai tabel dan simpan reset reason, error/drop count, pending queue dan resource samples tanpa menyimpan isi ketikan pengguna di telemetry.

### T07 — UAT aplikasi dan accessibility [QA/HW + APP]

- [ ] Penguji selain implementer menyelesaikan load→connect→sync→edit→save→verify→backup→restore→recover dengan manual, tanpa bantuan console developer.
- [ ] Selesaikan seluruh `APP/docs/manual-visual-checklist.md`, profile dialog, keyboard-only flow dan screen reader pada desktop/mobile viewports.
- [ ] Chrome/Edge pada OS yang diiklankan diuji; Firefox/Safari diuji untuk workspace non-BLE. Mobile layout PASS bukan otomatis mobile Web Bluetooth supported.
- [ ] Catat usability issue dan severity; tidak ada blocker yang menyebabkan perubahan tidak sengaja, kehilangan backup atau salah paham saved/verified.

### T08 — Acceptance per target dan klaim support [QA/HW + RELEASE]

- [ ] WROOM-32: T01–T07 yang relevan lengkap, 5×6×3 definition sesuai build, encoder/runtime dan NVS terbukti.
- [ ] nice!nano v2: checklist hardware lama diselesaikan ulang pada kandidat baru, UF2/hash dan InternalFS recovery dibuktikan.
- [ ] ESP32-S3: seluruh mode yang diklaim, GPIO, shared BLE/USB lifecycle serta battery/sleep bila ada dibuktikan.
- [ ] RP2040: physical matrix/HID dan EEPROM diuji melalui host Raw HID yang sesuai; catat bahwa APP belum menyediakan USB configuration.
- [ ] STM32F103: exact chip/flash layout, physical scan, USB composite, atomic flash dan boot/recovery dibuktikan.
- [ ] Minimal3 keyboard/definition berbeda diterima untuk rilis awal sesuai P01. Target lain tidak hilang: tetap experimental dengan item acceptance terbuka sampai fixture dan bukti tersedia.

### G2 — Checklist HARDWARE/UAT ACCEPTED

- [ ] **G2-01:** Semua skenario wajib T01–T08 untuk target rilis mencapai minimum yang disahkan, disertai raw result dan failure/retest history.
- [ ] **G2-02:** Tidak ada isu prioritas P0/P1 terbuka pada target/fitur yang dijanjikan; isu prioritas P2 yang tersisa tidak menyebabkan silent failure/data loss dan tercantum known issues. Ini klasifikasi severity, bukan nomor fase.
- [ ] **G2-03:** Semua pengujian mengacu SHA APP/FW/definition yang sama dengan kandidat; perubahan perilaku setelah acceptance memerlukan retest area terdampak.
- [ ] **G2-04:** QA/HW dan maintainer mengesahkan matriks kemampuan; board experimental tidak dicampur dengan daftar verified.

## 11. Security dan data safety sebelum produksi

### S01 — Threat model dan authorization policy [INT + RELEASE, P0]

- [ ] Dokumentasikan siapa boleh membaca keymap/macro/matrix state dan siapa boleh menulis/reset/boot, termasuk peer BLE terdekat, browser origin dan komputer yang sudah bonded.
- [ ] Tetapkan mekanisme konfigurasi berizin memakai fasilitas platform yang ada: pairing/bond security serta physical config window bila diperlukan. Filter service UUID dan OS pairing saja bukan bukti write authorization.
- [ ] Terapkan policy pada FW command boundary, bukan UI saja; mengetik normal tetap dapat berjalan sesuai scope tanpa membuka remap/reset ke peer tidak berizin.
- [ ] Buktikan unauthorized read/write ditolak, window timeout/disconnect menutup akses, secret/bond tidak masuk logs/profiles, dan dua peer tidak saling mengambil response.

### S02 — Parser dan destructive operation safety [APP + FW, P0]

- [ ] Review definition/profile/macro/packet/storage input untuk overflow, resource exhaustion, XSS/rendered strings, malformed nested data dan command yang keluar batas.
- [ ] Bootloader/factory-reset/matrix disclosure tetap opt-in sesuai config; permission dan konfirmasi destruktif menyebut data yang berubah dan langkah backup.
- [ ] Invalid atau malicious file tidak memulai write sebelum validasi; packet logs/diagnostic export tidak membocorkan data ketikan atau secret tanpa persetujuan.

### S03 — Supply chain dan release integrity [RELEASE]

- [ ] Review dependencies, Actions permissions, core/library provenance dan license compatibility; pin build inputs yang benar-benar dipakai, selesaikan vulnerability yang relevan terhadap rilis.
- [ ] Tetapkan hashing/provenance artefak dan siapa boleh publish; jangan meletakkan API key, credential atau token di source, plan, log evidence maupun binary config publik.
- [ ] Pastikan production archive tidak berisi test corruptor, dummy addresses/credentials, debug-only behavior atau metadata yang keliru.

### S04 — Security reporting dan sign-off [RELEASE]

- [ ] Sediakan kanal pelaporan privat untuk isu security, versi yang didukung dan kebijakan penanganannya; current `SECURITY.md` hanya meminta public GitHub issue.
- [ ] Review security berbasis bukti terhadap release diff dan skenario S01/S02; semua temuan high/critical ditutup atau fitur/target diblokir dengan keputusan scope eksplisit.

## 12. Fase 5 — Release engineering dan Gate G3: Ready production

### R01 — Version, compatibility dan changelog [RELEASE]

**Files:** APP `package.json`, `README.md`, `CHANGELOG.md`, manual; FW `library.properties`, `README.md`, `CHANGELOG.md`, `docs/API.md`, `docs/PORTING.md`.

- [ ] Pilih pasangan version APP/FW dan definition yang diuji, selaraskan RC/stable/experimental labels. Jangan menganggap package1.0.0 sebagai bukti readiness.
- [ ] Tambahkan changelog akurat: konteks, exact paths, evidence, impact dan rollback. Pertahankan catatan historis; klarifikasi klaim lama yang sudah digantikan, bukan mengubah sejarah seolah tidak pernah ada.
- [ ] Publikasikan compatibility matrix tested/experimental/unsupported beserta versi OS/browser, board revision, modes dan capability; tidak menggunakan `architectures=*` untuk mengklaim hardware acceptance universal.

### R02 — Dokumentasi pengguna dan developer [APP + FW]

- [ ] Lengkapi quick start, exact wiring/pins, core/library versions, definition format, flash instructions, Save/verify, upgrade, backup/restore dan unbrick/recovery.
- [ ] Selaraskan manual APP, README dan API/PORTING dengan fitur nyata termasuk batas6KRO, USB/BLE mode, macro execution dan fitur adapter yang unavailable.
- [ ] Dokumentasikan known issues, required permissions, privacy/local-first limits, local draft retention/deletion dan security contact.
- [ ] Kontributor bisa menjalankan build/test dari clean checkout dengan command yang ada; historical plans tidak diposisikan sebagai instruksi produksi terbaru.

### R03 — Reproducible artifacts dan integrity [RELEASE]

- [ ] Bangun APP dist dan firmware per target di CI bersih dengan source SHA/toolchain versions; simpan manifest compatibility APP/FW/definition, size dan checksums.
- [ ] Verifikasi rebuild memakai input yang sama; jika format binary memuat nondeterministic metadata, dokumentasikan perbedaannya dan provenance, jangan klaim byte-identical tanpa bukti.
- [ ] Uji download→hash verify→flash image rilis pada hardware yang benar. UF2 nice!nano, BIN/HEX target lain dan offset flash tidak tertukar.
- [ ] Pisahkan acceptance/debug artefak dan production artefak; retention release jangka panjang tidak bergantung hanya pada Actions artifacts 30 hari.

### R04 — Upgrade, rollback dan recovery rehearsal [RELEASE + QA/HW]

- [ ] Upgrade dari versi FW/APP terakhir yang didukung dengan config terisi; buktikan preservasi atau migrasi/backup flow yang dijelaskan, termasuk schema1→2 bila jalur tersebut masih dijanjikan.
- [ ] Uji downgrade ke firmware sebelumnya menggunakan backup kompatibel; jika schema tidak backward-compatible, prosedur menyebut reset/reconfigure dan data-loss warning sebelum tindakan.
- [ ] Rehearsal interrupted flash dan bootloader recovery pada fixture; pengguna dapat pulih tanpa tool/credential rahasia maintainer.
- [ ] Uji deploy ulang APP artefak sebelumnya dan compatible FW pairing; rollback tidak otomatis merusak config atau memaksa update firmware semua pengguna.

### R05 — CI/branch/release controls [RELEASE]

- [ ] Required checks membatasi merge/release; current deploy branch `master` dicocokkan dengan branch repository aktual, PR tidak mem-publish production.
- [ ] Deployment hanya memakai artefak commit yang lolos gate; branch/tag/release mapping tercatat. Tag/push/publish dijalankan setelah otorisasi maintainer, bukan otomatis oleh dokumen ini.
- [ ] Review perubahan final dan license/attribution; tidak ada debug scaffold, no-op fitur yang dijanjikan, skip test untuk menutupi failure, atau unsupported claim.

### R06 — Release candidate final sign-off [RELEASE + QA/HW]

- [ ] Jalankan ulang check/test/build, native/sanitizer/compile dan smoke browser pada candidate final; verifikasi hardware area terdampak perubahan terakhir.
- [ ] Pastikan G1, G2 dan S01–S04 lengkap, risk/known issues diterima, minimal 3 target verified sesuai scope, dan semua bukti merujuk release manifest yang sama.
- [ ] Maintainer APP, FW, QA/HW dan security menyetujui go/no-go dengan nama/tanggal; tidak mengganti sign-off dengan jumlah checkbox.

### G3 — Checklist READY PRODUCTION

- [ ] **G3-01:** G2 lulus dan seluruh target/fitur yang dipasarkan mempunyai bukti, bukan hanya simulator atau compile.
- [ ] **G3-02:** S01–S04 selesai; 0 known critical/high security issue dan 0 known data-loss/corruption/stuck-key blocker pada target rilis.
- [ ] **G3-03:** R01–R06 selesai: versi/docs benar, artifact/hash/provenance tersedia, CI final hijau, upgrade/rollback dan recovery berhasil.
- [ ] **G3-04:** Known issues non-blocking, support/incident owner dan maintenance policy tersedia; target experimental diberi batas jelas.
- [ ] **G3-05:** Persetujuan rilis eksplisit tercatat. Baru setelah itu status produk boleh disebut ready production untuk scope tersebut.

## 13. Publikasi dan pekerjaan setelah rilis

### R07 — Publish dan post-deploy acceptance [RELEASE + QA/HW]

- [ ] Setelah izin maintainer, buat tag/release kedua repo dengan compatibility manifest dan publish APP/firmware/definition/checksums yang diterima.
- [ ] Buka URL HTTPS production nyata: asset base path, navigation, manual, definition/profile offline-capable dan browser permission bekerja; refresh tidak merusak entry page.
- [ ] Hubungkan target fisik ke APP production: sync→remap→save→readback→power-cycle. Local preview PASS tidak menggantikan post-deploy hardware smoke.
- [ ] Verifikasi download firmware dari release publik dan hash; bila smoke gagal, jalankan rollback R04, tandai incident dan jangan meninggalkan status released-healthy.

### R08 — Stabilization dan maintenance [RELEASE]

- [ ] Triase laporan pilot dan pengguna dengan template board/revision/APP/FW/definition/browser/exact symptom serta log yang sudah direduksi datanya.
- [ ] Tinjau hasil pilot 7 hari sebelum memperluas rollout/klaim dukungan; incident blocker membuka kembali G2/G3 dan mendapat fix serta retest.
- [ ] Tetapkan proses patch, dependency/core update, compatibility regression dan penambahan board; setiap board baru melewati gate sendiri.
- [ ] Catat lessons learned, known limitations dan next backlog tanpa menambahkan telemetry/cloud yang tidak diminta.

### G4 — Checklist PRODUCTION RELEASED

- [ ] **G4-01:** R07 selesai dan live hardware smoke PASS pada artefak publik yang benar.
- [ ] **G4-02:** R08 memiliki owner/jadwal, rollback siap dipakai, dan tidak ada incident blocker yang masih disamarkan sebagai release sehat.

## 14. Backlog lanjutan yang tidak hilang

Item ini bukan cara mengurangi fitur rilis yang disahkan P01. Ini pekerjaan setelah gate untuk perluasan yang memang ditunda atau belum diminta; promosi ke scope rilis harus mengubah P01 dan acceptance terkait.

- [ ] **B01 — Promosikan target experimental yang belum lolos T08** setelah fixture tersedia; jangan menghapus RP2040/STM32/nRF52/S3 dari daftar pekerjaan hanya karena WROOM lebih dulu selesai.
- [ ] **B02 — Undo/redo dan copy/paste keymap** setelah draft/identity/recovery terbukti; ikuti deliberate deferral roadmap lama, bukan implementasi sebelum fondasi aman.
- [ ] **B03 — Variasi definition/layout dan macro opcode tambahan** berdasarkan fixture pengguna serta kontrak yang terbukti; parser yang menerima enum bukan dukungan end-to-end.
- [ ] **B04 — Integrasi USB langsung di AirVIA/WebHID** hanya bila diminta sebagai fitur produk baru; saat ini firmware wired tidak memerlukan APP menambah transport baru untuk disebut firmware-tested.
- [ ] **B05 — PWA/IndexedDB/perluasan offline** hanya jika recovery/ukuran data membuktikan kebutuhan; workspace lokal sederhana tetap prioritas.
- [ ] **B06 — Backend/account/cloud/analytics/generic transport framework** tetap di luar scope saat ini; tidak dimulai tanpa permintaan baru dan pembahasan privacy/security.
- [ ] **B07 — Produksi hardware komersial bila relevan:** bila "production" mencakup penjualan PCB/perangkat, buat acceptance terpisah untuk DFM/assembly yield, fixture per-unit, programming/serial provisioning, power/thermal/ESD, battery safety dan regulasi RF/EMC pasar tujuan. Roadmap software/firmware ini bukan sertifikasi produk fisik.

## 15. Command verifikasi saat implementasi

Command di bawah adalah instruksi mendatang, **bukan hasil yang sudah dijalankan dalam sesi penyusunan dokumen**. Jalankan dari repo yang disebut; output harus exit0 dan hasil perilaku diperiksa. Untuk firmware Linux/WSL, jangan menjalankan ELF lama yang kebetulan ada di repo sebagai bukti build kandidat.

### APP — full gate

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm preview --host 127.0.0.1 --port 4173
```

Buka URL dengan base path dari `vite.config.ts` (saat baseline `/AirVIA/`), jalankan I02/T07, simpan screenshot/hasil, lalu hentikan preview. Test suite harus seluruhnya selesai; jangan hanya menjalankan subset agar gate hijau.

### FW — contoh native gate dari Linux/WSL pada root FW

```sh
g++ -std=c++11 -Wall -Wextra -Werror -Isrc tests/protocol_test.cpp src/VIA_Protocol.cpp src/VIA_RGBLight.cpp -o /tmp/via-protocol-check
/tmp/via-protocol-check
g++ -std=c++11 -Wall -Wextra -Werror -Isrc tests/matrix_test.cpp src/VIA_Matrix.cpp -o /tmp/via-matrix-check
/tmp/via-matrix-check
g++ -std=c++11 -Wall -Wextra -Werror -Isrc tests/keyboard_test.cpp src/VIA_Matrix.cpp src/VIA_Keyboard.cpp src/VIA_Protocol.cpp src/VIA_RGBLight.cpp -o /tmp/via-keyboard-check
/tmp/via-keyboard-check
```

Ini hanya tiga suite inti, **bukan pengganti I03 penuh**. Jalankan suite adapter/sanitizer/compile dengan flags pada `FW/.github/workflows/ci.yml`, ditambah regression tests baru untuk perubahan yang dibuat. Hapus executable sementara setelah bukti disimpan.

### FW — contoh compile reference sketches

```sh
arduino-cli compile --fqbn esp32:esp32:esp32 --libraries . examples/ESP32_WROOM32_VIA_BLE
arduino-cli compile --fqbn esp32:esp32:esp32s3 --libraries . examples/ESP32S3_VIA_BLE
arduino-cli compile --fqbn adafruit:nrf52:promicronrf52840 --libraries . examples/nice_nano_v2_VIA_BLE
arduino-cli compile --fqbn rp2040:rp2040:rpipico:usbstack=tinyusb --libraries . examples/RP2040_VIA_RawHID
arduino-cli compile --fqbn arduino:avr:uno --libraries . examples/Protocol_Self_Test
```

Prasyarat: versi core/library yang disahkan P02 terpasang; nice!nano variant melalui installer yang sudah ada. Untuk STM32, tetapkan FQBN/core/USB integration dari board aktual pada P01/P02 dan tambahkan compile gate; jangan menebak FQBN lalu mengklaim compile support. Tidak ada command flash/destructive test dijalankan hanya karena tercantum di dokumen ini.

## 16. Standar catatan bukti dan titik mulai berikutnya

Untuk setiap item yang dicentang setelah baseline, catat field berikut dalam hasil acceptance: ID pekerjaan; tanggal/pelaksana; SHA APP/FW/definition; board/PCB/mode; OS/browser/core/library; command atau langkah reproduksi; expected vs actual; PASS/FAIL; lokasi log/screenshot/hash; bug terkait; retest yang diperlukan. Gunakan data fixture, bukan informasi pengguna atau secret.

Artefak hasil baru dibuat saat pengujian benar-benar berlangsung, misalnya APP `docs/testing/` untuk hasil aplikasi dan FW `docs/` untuk board acceptance mengikuti checklist nice!nano yang sudah ada. Jangan membuat file bukti kosong yang terlihat seperti test sudah berjalan.

**Titik mulai implementasi:** P01/P02 → kontrak C01–C05 dan desain security S01 → G0. Tutup risiko prioritas P0 sebelum memperluas fitur, lalu kerjakan WROOM vertical slice, cross-repo integration dan G1. Dokumen ini menyelesaikan pekerjaan perencanaan; seluruh checkbox mendatang tetap terbuka sampai ada implementasi dan bukti sesuai gate.
