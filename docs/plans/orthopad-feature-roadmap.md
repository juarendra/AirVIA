# OrthoPad Feature Roadmap Implementation Plan

Updated: 2026-08-04  
Status: Proposed  
Owner: AirVIA / OrthoPad  
Target hardware: Arduino Pro Micro / ATmega32U4 5 V 16 MHz

## 1. Tujuan

Mengembangkan OrthoPad menjadi controller CAD 2D/3D yang:

- presisi saat menggerakkan view Fusion 360;
- aman saat konfigurasi dan diagnosis hardware;
- mudah dikonfigurasi tanpa reflash firmware;
- dapat memiliki profil kerja berbeda untuk Sketch, Modify, dan Core;
- tetap kompatibel dengan firmware yang sudah terpasang;
- tidak bergantung pada backend/cloud.

## 2. Baseline saat ini

### 2.1 Firmware

Lokasi: `firmware/`

- PlatformIO.
- Board definition lokal: `firmware/boards/orthopad_promicro16.json`.
- USB product descriptor: `OrthoPad`.
- Hardware: 5 tombol, 1 joystick analog + switch, 1 encoder + switch.
- 3 layer.
- HID keyboard dan mouse.
- Encoder wheel telemetry.
- Joystick telemetry 12 byte.
- CAD settings payload 23 byte.
- EEPROM dual-slot dengan CRC dan generation.
- Binary serial protocol 115200 baud.
- `SetTestMode` menonaktifkan semua HID saat monitor aktif.
- Joystick production polling: 20 ms / 50 Hz.
- Setting device tervalidasi saat ini: `Deadzone=30`, `Speed=8`, `Curve=500`.

### 2.2 AirVIA

Lokasi utama:

- `src/device/orthopad.ts` — type, codec, backend.
- `src/store/orthopad.svelte.ts` — state, dirty state, apply/discard.
- `src/ui/orthopad/OrthoPadWorkspace.svelte` — editor utama.
- `src/ui/orthopad/JoystickMonitor.svelte` — telemetry dan HID test mode.
- `src/serial/` — Web Serial transport.
- `src/core/orthopad-protocol.ts` — command enum dan frame codec.

AirVIA sudah mendukung:

- keymap tiga layer;
- encoder clockwise/counter-clockwise;
- center, deadzone, speed, curve;
- invert X/Y;
- monitor joystick dan switch;
- encoder telemetry;
- Fusion orbit/pan dengan mouse chord;
- apply, commit, discard, reset defaults;
- local-first deployment via GitHub Pages.

### 2.3 Constraint penting

- `MaxPayload` firmware saat ini 128 byte.
- Action dasar berukuran 4 byte.
- Storage slot firmware saat ini 256 byte.
- Browser Web Serial hanya tersedia di Chrome/Edge.
- Web app tidak dapat mengetahui aplikasi aktif di OS.
- HID test mode harus tetap mencegah mouse/keyboard event saat monitor aktif.
- Firmware lama harus tetap dapat digunakan untuk telemetry legacy 8 byte.

## 3. Prioritas roadmap

| Prioritas | Fitur | Nilai | Risiko |
|---|---|---:|---:|
| P0 | Calibration Wizard | Sangat tinggi | Rendah |
| P0 | HID safety release / recovery | Sangat tinggi | Rendah |
| P0 | Profile export/import | Tinggi | Rendah |
| P1 | Tap/Hold/Double-tap button behavior | Tinggi | Sedang |
| P1 | Macro sequence editor | Tinggi | Tinggi |
| P1 | Per-layer joystick profile | Tinggi | Sedang |
| P1 | Navigation presets | Sedang | Sedang |
| P2 | App-specific profile switching | Tinggi, tetapi perlu desktop helper | Tinggi |
| P2 | Firmware update dari AirVIA | Sedang | Tinggi |
| P3 | Virtual 3Dconnexion / 6DOF HID | Eksperimental | Sangat tinggi |

Urutan implementasi wajib mengikuti P0 sebelum P1. Jangan mengerjakan app-specific switching atau 6DOF sebelum safety, profile, dan action model stabil.

---

# 4. Milestone M0 — Contract cleanup dan baseline lock

## Tujuan

Mengunci perilaku yang sudah berhasil sebelum menambah fitur baru.

## Perubahan

### Firmware

1. Pisahkan nama konfigurasi gesture yang ambigu:
   - `panModifier` saat ini dipakai sebagai modifier orbit Shift.
   - Pertahankan byte wire offset 21 untuk backward compatibility.
   - Rename field internal menjadi `orbitModifier`, atau beri komentar eksplisit bahwa byte tersebut adalah modifier orbit.
2. Pertahankan protocol schema dan ukuran payload 23 byte.
3. Update `firmware/protocol.md`:
   - telemetry polling monitor 50 Hz;
   - orbit = modifier + middle mouse;
   - pan = middle mouse;
   - semantics button mask dan mode flags.
4. Pastikan `releaseAllHid()` membersihkan:
   - keyboard modifiers;
   - left/middle/right mouse;
   - CAD gesture flags;
   - encoder/joystick state.

### AirVIA

1. Update teks monitor dari 20 samples/sec menjadi 50 samples/sec.
2. Pastikan codec tetap menerima telemetry 8 byte dan 12 byte.
3. Tambah test bahwa `SetTestMode` selalu dilepas saat monitor disconnect.
4. Tambah test bahwa error command dari firmware legacy tidak membuat monitor berhenti total.

## Acceptance criteria

- Tidak ada perubahan wire format.
- `pnpm check`, `pnpm test`, `pnpm build` pass.
- `pio run -e promicro5v` dan `pio run -e diagnostic` pass.
- Fusion orbit, pan, zoom, dan normal cursor tidak berubah.

---

# 5. Milestone M1 — Joystick Calibration Wizard (P0)

## Tujuan

Mengurangi drift dan trial-and-error saat mengganti joystick atau hardware.

## UX flow

1. User membuka `CAD settings → Calibrate joystick`.
2. AirVIA menampilkan warning: lepaskan joystick dan jangan menyentuh switch.
3. AirVIA mengaktifkan `SetTestMode=1`.
4. AirVIA mengambil 100–200 sampel raw X/Y pada 50 Hz.
5. Sistem menghitung center menggunakan median atau trimmed mean.
6. User menggerakkan joystick ke:
   - kiri;
   - kanan;
   - atas;
   - bawah.
7. AirVIA mengambil sampel tiap arah dan menampilkan range yang terbaca.
8. Sistem menghitung noise idle dan menyarankan deadzone.
9. User melihat preview dot dan dapat menerima atau membatalkan hasil.
10. Test mode dilepas pada semua exit path.
11. Nilai hanya masuk draft. Firmware ditulis setelah **Apply & Save**.

## Algoritma awal

- Center X/Y: median 100 sampel idle.
- Noise X/Y: percentile 95 dari `abs(raw-center)`.
- Suggested deadzone: `max(30, ceil(max(noiseX, noiseY) * 1.5))`, dibatasi maksimal 200.
- Jika arah gerak user menghasilkan delta terbalik terhadap ekspektasi, tawarkan invert X/Y.
- Jika range salah satu sumbu kurang dari 300 ADC count, tampilkan warning hardware.
- Jangan mengubah `speedMilli` dan `curveMilli` otomatis pada versi pertama.

## File target

- Create: `src/ui/orthopad/JoystickCalibration.svelte`.
- Modify: `src/ui/orthopad/OrthoPadWorkspace.svelte`.
- Modify: `src/store/orthopad.svelte.ts`.
- Modify: `src/device/orthopad.ts` hanya jika sampling helper diperlukan.
- Test: `src/ui/orthopad/JoystickCalibration.test.ts`.
- Test: `src/device/orthopad.test.ts` untuk payload/settings round-trip.
- Docs: `docs/OrthoPad-Usage.md`.

## Acceptance criteria

- Calibration tidak menghasilkan HID event.
- Cancel tidak mengubah draft.
- Apply menghasilkan center/deadzone yang terlihat pada `GetCadSettings`.
- Drift idle tidak menyebabkan cursor bergerak setelah calibration.
- Disconnect, error, dan close modal selalu menonaktifkan test mode.

---

# 6. Milestone M2 — HID Safety Release dan Recovery (P0)

## Tujuan

Mencegah keyboard/mouse stuck akibat kabel dicabut, crash, atau chord yang tidak dilepas.

## Protocol

Tambahkan command baru setelah `SetTestMode`:

```text
0x42 ReleaseHid
request: kosong
response: kosong
behavior: releaseAllHid(), tanpa mengubah config atau test mode
```

Command harus idempotent.

## Firmware

- Implementasikan `ReleaseHid` di `handleCommand()`.
- Panggil `releaseAllHid()` saat:
  - command diterima;
  - `SetTestMode=1`;
  - konfigurasi di-discard atau reset;
  - reboot.
- Jangan menambahkan watchdog serial global yang mematikan HID pada penggunaan normal; firmware dapat dipakai sebagai mouse tanpa AirVIA terbuka.

## AirVIA

- Tambah button **Release HID** pada connection/safety area.
- Tampilkan confirmation ringan hanya jika ada gesture aktif; command tetap aman jika idle.
- Panggil release sebelum disconnect jika transport masih hidup.
- Panggil release dalam `finally` pada monitor dan calibration.

## Testing

- Backend test command request/response.
- Firmware protocol smoke test command `0x42`.
- Manual test: tahan orbit/pan, tekan Release HID, pastikan semua state lepas.

## Acceptance criteria

- Tidak ada modifier atau mouse button yang tertinggal.
- Release tidak menghapus config, layer, atau EEPROM.
- Command dapat dipanggil berulang kali tanpa error.

---

# 7. Milestone M3 — Local Profile Export/Import (P0)

## Tujuan

Menyimpan konfigurasi Fusion/CAD sebelum eksperimen dan memindahkan konfigurasi antar device.

## Profile schema

Buat schema versioned, misalnya:

```ts
type OrthoPadProfile = {
  format: 'airvia-orthopad-profile';
  version: 1;
  name: string;
  description?: string;
  createdAt: string;
  device?: {
    deviceName?: string;
    firmwareVersion?: string;
    configSchema?: number;
  };
  config: OrthoPadConfig;
};
```

Aturan:

- Tidak menyimpan serial number atau secret.
- Import harus divalidasi sebelum masuk state.
- Profile lama dengan field tambahan boleh ditolak dengan error yang jelas.
- Profile tidak boleh langsung menulis device; harus masuk draft.

## UX

- Export current draft.
- Import profile.
- Preview diff sebelum apply.
- Save named profile ke localStorage/IndexedDB.
- Duplicate profile.
- Delete profile.
- Restore last known good profile.

## File target

- Create: `src/core/orthopad-profile.ts`.
- Create: `src/core/orthopad-profile.test.ts`.
- Create: `src/ui/orthopad/OrthoPadProfiles.svelte`.
- Modify: `src/store/orthopad.svelte.ts`.
- Modify: `src/ui/orthopad/OrthoPadWorkspace.svelte`.
- Modify: `src/App.svelte` bila menu perlu registrasi.

## Acceptance criteria

- Export lalu import menghasilkan config yang sama.
- Import invalid tidak mengubah config aktif.
- Profile dapat dipakai offline.
- Apply profile tetap menggunakan jalur `setKeymap → setEncoder → setCadSettings → commit → sync`.
- Diff menampilkan perubahan keymap, encoder, dan CAD settings.

---

# 8. Milestone M4 — Button Behavior: Tap/Hold/Double-tap (P1)

## Tujuan

Membuat lima tombol lebih berguna untuk operasi CAD tanpa menambah hardware.

## Behavior model

Versi pertama hanya untuk tombol BTN1–BTN5:

```text
none
 tap(action)
 hold(action)
 doubleTap(action)
```

Default behavior tetap sama seperti sekarang.

## Protocol dan storage

Current action 4 byte tidak cukup untuk menyimpan tiga behavior per tombol secara efisien dalam payload penuh. Pilihan yang direkomendasikan:

1. Naikkan storage slot dari 256 ke 512 byte.
2. Naikkan `MaxPayload` hanya jika diperlukan; lebih aman memakai command per layer/button.
3. Tambahkan command:

```text
0x14 GetButtonBehavior
request: layer u8 + button u8
response: tap action + hold action + double-tap action

0x15 SetButtonBehavior
request: layer u8 + button u8 + 3 action
response: kosong
```

4. Jangan mengubah format `GetKeymap` lama.
5. Tambahkan capability bit pada `GetInfo` agar AirVIA dapat membedakan firmware lama.
6. Bump `configSchema` karena EEPROM structure berubah.

## Firmware state machine

Per tombol simpan:

- `pressedAt`;
- `releasedAt`;
- `tapCount`;
- `holdFired`;
- `pendingTap`.

Rules awal:

- Hold action fire sekali setelah `holdMs`.
- Double-tap memakai window baru `doubleTapMs`, default 250 ms.
- Tap ditunda sampai double-tap window lewat atau input berikutnya jelas hold.
- `releaseAllHid()` membersihkan semua pending state.
- Test mode tetap membaca state tetapi tidak mengirim HID.

## AirVIA

- Editor behavior per tombol.
- Reuse keycode picker dan modifier picker.
- Tampilkan timing fields hanya di advanced section.
- Tampilkan compatibility badge bila firmware belum mendukung behavior API.

## Acceptance criteria

- Existing 4-byte keymap firmware tetap dapat synchronize.
- Firmware baru dapat tap, hold, double-tap tanpa duplicate event.
- Holding tombol tidak mengirim tap sekaligus, kecuali behavior memang dikonfigurasi demikian.
- Disconnect/release tidak meninggalkan key pressed.

---

# 9. Milestone M5 — Macro Sequence Editor (P1)

## Tujuan

Mendukung rangkaian shortcut CAD seperti `Shift+S`, `E`, `Enter`, dan delay.

## Macro model

Gunakan macro ID, bukan menaruh sequence langsung pada setiap keymap action.

```ts
type OrthoPadMacroStep =
  | { type: 'key'; keycode: number; modifiers: number; durationMs?: number }
  | { type: 'wheel'; amount: number }
  | { type: 'delay'; durationMs: number };
```

Batas versi awal:

- maksimal 16 step per macro;
- maksimal 32 macro;
- maksimal 256 byte serialized per macro;
- tidak ada loop atau conditional;
- hanya USB HID key dan wheel.

## Protocol

```text
0x16 GetMacro
request: macroId u8

0x17 SetMacro
request: macroId u8 + encoded steps

0x18 DeleteMacro
request: macroId u8
```

Tambahkan action type `Macro` melalui command baru atau extension action. Jangan mengubah arti action type 0–2.

## Storage

- Storage slot minimal 1024 byte atau gunakan append/indexed records.
- Simpan macro metadata dan CRC.
- Commit harus atomic seperti config utama.
- Jika storage penuh, response `StorageError` dengan pesan yang dapat ditampilkan UI.

## Firmware executor

- Non-blocking state machine; jangan memakai `delay()` untuk macro playback.
- Macro dapat dibatalkan oleh:
  - tombol emergency release;
  - test mode;
  - disconnect/reboot.
- Semua modifier yang ditekan macro harus dilepas pada akhir atau abort.
- Batasi satu macro aktif pada satu waktu untuk versi pertama.

## AirVIA

- Macro list.
- Step editor.
- Reorder, duplicate, delete.
- Test macro hanya setelah user menekan tombol explicit.
- Preview textual:

```text
Shift + S → delay 100 ms → E → Enter
```

## Acceptance criteria

- Macro tidak memblokir telemetry atau serial protocol.
- Abort selalu release HID.
- Macro tersimpan dan survive reboot.
- Firmware lama tetap dapat membaca config tanpa macro melalui capability check.

---

# 10. Milestone M6 — Per-layer joystick profile (P1)

## Tujuan

Membuat sensitivitas sesuai konteks kerja:

- Core: navigasi umum;
- Sketch: presisi;
- Modify: navigasi lebih cepat.

## Model

Current `CadSettings` global. Tambahkan `JoystickProfile[LayerCount]`:

```text
centerX, centerY, deadzone, speedMilli, curveMilli, invertX, invertY
```

Global settings tetap menyimpan timing dan encoder behavior.

## Protocol

Tambahkan command tanpa mengubah `GetCadSettings` lama:

```text
0x22 GetJoystickProfile
request: layer u8

0x23 SetJoystickProfile
request: layer u8 + profile payload
```

Capability bit wajib ditambahkan. Firmware lama tetap memakai global settings.

## Firmware

- `axisDelta()` menerima profile aktif.
- Saat active layer berubah, profile baru berlaku pada sample berikutnya.
- Calibration Wizard memilih layer target atau menerapkan hasil ke semua layer.
- `GetJoystickState` tetap mengembalikan active layer.

## AirVIA

- Tab/profile selector pada CAD settings.
- Tombol `Copy to all layers`.
- Preview nilai aktif.
- Dirty diff per layer.

## Acceptance criteria

- Keymap/encoder layer lama tidak berubah.
- Perubahan layer memengaruhi joystick speed tanpa reset.
- Firmware lama tetap dapat dikonfigurasi memakai global settings.

---

# 11. Milestone M7 — Navigation presets (P1)

## Tujuan

Menyediakan konfigurasi siap pakai tanpa auto-detect aplikasi.

## Preset awal

1. Fusion 360 default:
   - orbit: Shift + middle mouse;
   - pan: middle mouse;
   - zoom: wheel.
2. Generic CAD:
   - configurable modifier;
   - configurable middle button.
3. Blender-like:
   - preset hanya jika gesture HID kompatibel.

## Implementasi

- Preset hanya menulis draft.
- User melihat diff sebelum Apply.
- Preset tidak overwrite profile tanpa confirmation.
- Simpan preset sebagai data versioned di `src/core/orthopad-presets.ts`.

## Acceptance criteria

- Preset dapat diterapkan dan dibatalkan.
- Semua mapping terlihat sebelum write.
- Tidak ada perubahan firmware untuk preset yang hanya memakai action existing.

---

# 12. Milestone M8 — App-specific profile switching (P2)

## Keputusan arsitektur

Browser AirVIA tidak dapat membaca aplikasi foreground dan tidak dapat mengganti firmware profile secara otomatis. Jangan membuat feature palsu di web app.

Implementasi yang benar memerlukan desktop helper:

```text
AirVIA web app ⇄ Web Serial/WebSocket bridge ⇄ desktop profile daemon ⇄ OrthoPad
```

## Scope desktop helper

- Windows first.
- Daemon membaca foreground process.
- Mapping process name ke profile.
- Debounce switch 300–500 ms.
- Explicit HID release sebelum apply profile.
- Log local only.
- No cloud/account.

## Stop condition

Jangan mulai sebelum profile export/import, capability negotiation, dan emergency release stabil.

---

# 13. Milestone M9 — Firmware update flow (P2)

## Tujuan

Mengurangi ketergantungan pada PlatformIO saat distribusi firmware.

## Pilihan

### Opsi A — Dokumentasi PlatformIO

- Paling aman.
- Tetap menjadi jalur development dan recovery.
- Recommended untuk milestone awal.

### Opsi B — Web Serial bootloader upload

- Memerlukan akses bootloader ATmega32U4.
- Harus menangani port berubah setelah 1200-baud touch.
- Harus memverifikasi board identity, image hash, signature, dan size.
- Risiko brick lebih tinggi.

Implementasi Opsi B hanya setelah ada recovery instructions dan test board khusus.

---

# 14. Testing strategy

## Unit tests AirVIA

Wajib:

- profile schema validation;
- profile export/import round-trip;
- diff generation;
- calibration math;
- invalid calibration samples;
- action/macro encoding;
- capability fallback;
- `SetTestMode` and `ReleaseHid` lifecycle;
- legacy 8-byte telemetry;
- 12-byte telemetry;
- default settings `(30,8,500)`.

Commands:

```bash
pnpm check
pnpm test
pnpm build
```

## Firmware tests

Native test helper yang sudah ada perlu tetap dipakai:

```bash
pio test -e native
```

Jika GCC tidak tersedia, CI harus menyediakan native compiler. Jangan menganggap Python simulation sebagai pengganti native test permanen.

Coverage minimum:

- encoder detent one-shot;
- calibration math jika dipindah ke pure helper;
- tap/hold/double-tap state machine;
- macro executor abort;
- action validation;
- storage serialization size and CRC;
- HID release state reset.

Build:

```bash
pio run -e promicro5v
pio run -e diagnostic
```

## Hardware acceptance test

Checklist setiap firmware release:

1. USB descriptor = `OrthoPad`.
2. COM port muncul setelah reset.
3. `GetInfo` benar.
4. Semua BTN1–BTN5 terdeteksi.
5. JOY SW dan ENC SW bit benar.
6. Joystick center stabil.
7. Deadzone tidak drift.
8. Cursor bergerak di desktop.
9. Fusion orbit bekerja.
10. Fusion pan bekerja.
11. Encoder wheel berhenti setelah encoder berhenti.
12. Monitor tidak mengirim HID.
13. Release HID melepas semua state.
14. Apply → Commit → Sync mempertahankan config setelah reboot.
15. Firmware lama tetap dapat dibaca jika capability tidak ada.

## Regression test fisik

- Tutup Joystick Monitor saat menguji HID.
- Uji pada desktop sebelum Fusion.
- Uji Fusion dengan model sederhana.
- Catat setting device, firmware version, dan commit.
- Jangan menguji sambil serial monitor lain memegang COM port.

---

# 15. Rollout dan commit policy

Setiap milestone harus dikirim dalam commit terpisah:

```text
feat(orthopad): add joystick calibration wizard
fix(firmware): add HID release command
feat(airvia): add OrthoPad profile export
feat(orthopad): add button hold behavior
feat(orthopad): add macro sequences
feat(orthopad): add per-layer joystick profiles
```

Urutan delivery:

1. Build/test lokal.
2. Commit.
3. Push `master`.
4. Tunggu GitHub Pages deploy.
5. Flash firmware jika firmware berubah.
6. Jalankan hardware acceptance checklist.
7. Update `CHANGELOG.md`.
8. Update `.cooper/context/orthopad-airvia.md` dengan evidence.

Jangan menggabungkan firmware protocol migration, UI redesign, dan macro executor dalam satu commit.

---

# 16. Risiko dan mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Config schema berubah | Device lama tidak kompatibel | Capability bit + schema version + fallback |
| Storage EEPROM penuh | Config tidak bisa commit | Naikkan slot, ukur serialized size, test storage full |
| Macro menahan key | User kehilangan kontrol | `ReleaseHid`, abort path, reboot recovery |
| Monitor mengirim HID | Cursor/model bergerak saat diagnosis | Test mode wajib, `finally` disable, safety release |
| Center calibration salah | Cursor drift | median/trimmed mean + preview + cancel |
| Web Serial port locked | Flash/read gagal | UI error jelas, tutup monitor, reconnect guide |
| Modifier semantics ambigu | Orbit/pan salah | Rename semantic field tanpa mengubah wire offset |
| Auto profile browser tidak mungkin | Feature palsu | Desktop helper terpisah, jangan hack browser |
| HID 6DOF tidak kompatibel | Fusion tidak merespons | Tunda sampai proof-of-concept device terpisah |

---

# 17. Definition of done per feature

Feature dianggap selesai hanya jika:

- firmware dan AirVIA contract sudah sama;
- legacy behavior tidak rusak;
- error dan disconnect path aman;
- UI tidak menulis device sebelum Apply & Save;
- unit test menangkap edge case utama;
- PlatformIO build pass;
- hardware smoke test pass jika firmware berubah;
- `CHANGELOG.md` diperbarui;
- commit dan push selesai;
- checkpoint evidence diperbarui.

# 18. Rekomendasi next action

Mulai dari **M1 Calibration Wizard**, lalu **M2 HID Safety Release**, lalu **M3 Profile Export/Import**. Ketiganya memberi nilai langsung, tidak memerlukan protocol migration besar, dan menjadi fondasi aman untuk tap/hold serta macro editor.
