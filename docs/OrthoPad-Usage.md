# Panduan OrthoPad di AirVIA

AirVIA memiliki dua alur koneksi yang berbeda:

- **VIA/BLE**: untuk keyboard BLE dan V3 definition.
- **OrthoPad/USB**: untuk Arduino Pro Micro / ATmega32U4 melalui Web Serial.

Gunakan alur **OrthoPad** untuk macropad CAD.

## 1. Persiapan

Kebutuhan:

- Arduino Pro Micro / ATmega32U4 5 V.
- Kabel USB data.
- Chrome atau Edge.
- AirVIA: <https://juarendra.github.io/AirVIA/>.
- Firmware PlatformIO dari folder `firmware/`.

Firefox dan Safari tidak mendukung Web Serial.

## 2. Flash firmware production

Buka terminal:

```bash
cd D:\Pribadi\AirVIA\firmware
pio device list
```

Cari perangkat dengan deskripsi `Arduino Leonardo` atau `USB Serial Device`, bukan COM Bluetooth.

Build dan flash:

```bash
pio run -e promicro5v -t upload --upload-port COM14
```

Ganti `COM14` dengan port aktual. Jika port tidak terdeteksi:

1. Tekan tombol reset Pro Micro dua kali dengan cepat.
2. Jalankan `pio device list` segera setelah reset.
3. Gunakan port bootloader yang muncul sementara.

Firmware production menyediakan:

- USB HID keyboard dan mouse.
- Keymap tiga layer.
- Encoder.
- Joystick orbit/pan.
- Sumbu joystick menggerakkan cursor OS pada firmware production; polling input berjalan 20 Hz.
- Tahan switch encoder + gerakkan joystick: pan dengan middle/wheel-button drag.
- Tahan switch joystick + switch encoder + gerakkan joystick: orbit dengan modifier `Shift` + middle/wheel-button drag.
- Tahan switch joystick saja: modifier `Shift`; tap singkat tetap left click.
- Saat Joystick Monitor terbuka, HID sengaja dinonaktifkan agar pengujian tidak menggerakkan cursor.
- Protokol konfigurasi AirVIA.
- Joystick telemetry untuk monitor.

## 3. Uji hardware dengan diagnostic mode

Diagnostic mode membaca input tanpa menjalankan fungsi HID production.

```bash
cd D:\Pribadi\AirVIA\firmware
pio run -e diagnostic -t upload --upload-port COM14
pio device monitor -p COM14 -b 115200
```

Output contoh:

```text
JOY_X=513 JOY_Y=505 JOY_SW=1 ENC_A=1 ENC_B=1 ENC_SW=1 BTN=11111
```

Interpretasi:

- `JOY_X` dan `JOY_Y`: nilai analog 0–1023.
- Nilai idle biasanya berada dekat 512, tetapi tiap joystick dapat berbeda.
- `JOY_SW=0`: switch joystick ditekan karena input memakai pull-up aktif-low.
- `BTN=0`: tombol ditekan; `BTN=1`: tombol dilepas.

Setelah diagnostic selesai, flash ulang firmware production sebelum menggunakan Fusion 360:

```bash
pio run -e promicro5v -t upload --upload-port COM14
```

## 4. Membuka konfigurator OrthoPad

1. Buka <https://juarendra.github.io/AirVIA/> atau jalankan AirVIA lokal.
2. Pilih tab **OrthoPad**.
3. Klik **Connect OrthoPad**.
4. Pilih port USB Pro Micro.
5. Izinkan akses serial jika browser meminta izin.
6. Tunggu sampai device info dan konfigurasi tampil.

Jangan membuka Arduino Serial Monitor atau `pio device monitor` bersamaan dengan AirVIA. Satu port serial hanya dapat digunakan satu aplikasi pada satu waktu.

## 5. Menggunakan Joystick Monitor

Panel **Joystick monitor** tampil di bagian atas workspace OrthoPad setelah koneksi.

Monitor menampilkan:

- Posisi live joystick pada bidang X/Y.
- Raw ADC X dan Y.
- Offset dari center.
- Radius deadzone.
- Jarak joystick dari center.
- Status `BTN1` sampai `BTN5`.
- Status `JOY SW` dan `ENC SW`.
- Counter encoder kumulatif dan arah putaran terakhir.
- Status switch encoder pada panel **Encoder tester**.
- Logical `JOY_X` membaca pin fisik `A2`; logical `JOY_Y` membaca pin fisik `A1`.
- Layer aktif.

Dot monitor mengikuti arah output efektif setelah Invert X/Y. Kartu raw X/Y tetap menunjukkan ADC asli agar diagnosis sensor tidak tertukar dengan arah HID.

### Calibration Wizard

Gunakan **Start calibration** pada panel Joystick Monitor jika center joystick
bergeser atau deadzone belum sesuai.

1. Lepaskan joystick dan biarkan tetap di tengah sampai `Center capture` selesai.
2. Gerakkan joystick perlahan melewati kiri, kanan, atas, dan bawah sampai `Range capture` selesai.
3. Tinjau center, noise, range, dan deadzone yang disarankan.
4. Aktifkan `Invert X/Y` jika arah fisik terbalik.
5. Klik **Use calibration** untuk memasukkan hasil ke draft.
6. Klik **Apply & Save** pada CAD settings untuk menulis EEPROM.

Calibration tidak menggerakkan cursor karena Joystick Monitor mengaktifkan
test mode. Jika range axis terlalu sempit, periksa kabel VCC, GND, dan wiper
joystick sebelum menerapkan hasil.

### Pemeriksaan normal

Saat joystick dilepas:

- Titik berada dekat pusat lingkaran.
- Raw X/Y relatif stabil.
- Status `In deadzone` tampil.
- `JOY SW` tidak menyala.

Saat joystick digerakkan:

- Titik mengikuti arah gerakan.
- Raw X/Y berubah secara kontinu.
- Nilai mendekati 0 atau 1023 di ujung sumbu.

Saat joystick switch ditekan:

- Indikator `JOY SW` berubah aktif.

Saat joystick switch ditahan:

- Mode berubah menjadi `Orbit active`; firmware menekan Shift + middle mouse.

Saat encoder switch ditahan sambil joystick digerakkan:

- Mode berubah menjadi `Pan active`; firmware menekan middle mouse.

Saat kedua switch ditahan bersama:

- Mode tetap `Orbit active`; firmware menekan Shift + middle mouse.

Saat encoder diputar:

- Counter `steps` berubah.
- Arah terakhir menampilkan `Clockwise` atau `Counter-clockwise`.
- Switch encoder tetap diuji terpisah dari rotasi.


## 6. Kalibrasi joystick

Kalibrasi dilakukan di panel **CAD settings**.

### Center X/Y

1. Lepaskan joystick.
2. Amati raw X/Y di monitor selama beberapa detik.
3. Masukkan nilai rata-rata idle ke `Center X` dan `Center Y`.
4. Klik **Apply & Save**.

Contoh: jika idle stabil di X=513 dan Y=505, gunakan center tersebut.

### Deadzone

Deadzone mengabaikan perubahan kecil di sekitar center.

- Naikkan jika titik bergerak sendiri saat joystick dilepas.
- Turunkan jika gerakan kecil tidak terdeteksi.
- Default firmware sekarang `30`; ubah bertahap sesuai noise joystick.
Konfigurasi EEPROM lama tidak otomatis berubah; pilih **Restore defaults** atau isi `30` lalu klik **Apply & Save**.

### Speed dan curve

- `Speed ×1000`: kecepatan gerak mouse.
- `Curve ×1000`: karakter respons joystick.
- `1000`: respons linear.
- Di bawah `1000`: gerakan awal lebih halus.
- Di atas `1000`: gerakan awal lebih agresif.
- Default firmware/AirVIA sekarang `Speed=8`, `Curve=500`, polling `20 ms` untuk kontrol lebih lambat dan halus.

### Invert X/Y

Gunakan checkbox **Invert X** atau **Invert Y** jika arah gerakan terbalik.

## 7. Mengatur tombol dan encoder

Pada bagian **Keymap**:

- Pilih layer `Core`, `Sketch`, atau `Modify`.
- Pilih fungsi setiap BTN1–BTN5.
- Pilih modifier jika diperlukan.

Pada bagian **Encoder**:

- Atur fungsi clockwise.
- Atur fungsi counter-clockwise.
- Default: mouse wheel `+1` dan `-1`.

Tombol encoder memiliki gesture firmware:

- Klik pendek: right-click.
- Tahan sekitar 700 ms: pindah layer.

Joystick switch:

- Klik pendek: left-click.
- Tahan sekitar 700 ms: orbit dengan Shift + middle mouse.

Encoder switch:

- Klik pendek: right-click.
- Tahan sambil menggerakkan joystick: pan dengan middle mouse.
- Tahan sekitar 700 ms tanpa gerakan joystick: pindah layer.

Kedua switch:

- Tahan bersama: orbit dengan Shift + middle mouse.

Klik **Apply & Save** untuk menulis staging config ke EEPROM dan melakukan verifikasi ulang.

Tombol lain:

- **Discard draft**: buang perubahan yang belum disimpan.
- **Restore defaults**: kembalikan konfigurasi default device.

## 8. Jika monitor tidak bekerja

### AirVIA tidak menemukan device

- Pastikan firmware production sudah ter-flash.
- Pastikan kabel USB adalah kabel data.
- Tutup Arduino IDE Serial Monitor dan PlatformIO monitor.
- Cabut-pasang USB.
- Tekan reset dua kali jika port bootloader diperlukan.
- Pastikan browser Chrome atau Edge.

### Telemetry timeout atau status error

Firmware lama sebelum versi telemetry tidak mengenal command `GetJoystickState`.
Flash ulang:

```bash
pio run -e promicro5v -t upload --upload-port COM14
```

### Raw X/Y tidak berubah

Periksa:

- JOY_X terhubung ke Arduino pin `A1`.
- JOY_Y terhubung ke Arduino pin `A2`.
- VCC joystick ke 5 V.
- GND joystick ke GND.
- Tidak ada short antara X/Y dan GND.

### Raw X/Y selalu 0 atau 1023

Kemungkinan kabel analog terputus, VCC/GND salah, atau wiper joystick tidak terhubung ke A1/A2.

### Titik bergerak sendiri

- Naikkan deadzone.
- Kalibrasi ulang center X/Y.
- Periksa noise dan kualitas supply 5 V.

## 9. Deployment GitHub Pages

Workflow `.github/workflows/deploy.yml` menjalankan check, test, build, dan deploy saat ada push ke `master`.

Feature branch tidak langsung mengubah site live. Setelah merge ke `master`, tunggu workflow selesai di:

<https://github.com/juarendra/AirVIA/actions>

Site live:

<https://juarendra.github.io/AirVIA/>
