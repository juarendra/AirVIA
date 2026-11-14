# OrthoPad USB protocol

AirVIA mengonfigurasi firmware OrthoPad melalui Web Serial pada 115200 baud, 8-N-1.
Transport ini bukan VIA v13; gunakan tab **OrthoPad** di AirVIA.

## Frame

Semua integer little-endian.

| Offset | Ukuran | Field |
|---:|---:|---|
| 0 | 1 | Sync `0x4F` |
| 1 | 1 | Sync `0x50` |
| 2 | 1 | Protocol version (`1`) |
| 3 | 1 | Flags |
| 4 | 2 | Sequence |
| 6 | 1 | Command |
| 7 | 2 | Payload length |
| 9 | N | Payload |
| 9 + N | 2 | CRC-16/CCITT-FALSE |

CRC dihitung dari byte version sampai akhir payload, polynomial `0x1021`, initial `0xFFFF`, tanpa reflection.

### Flags

- `0x00`: request
- `0x01`: response
- `0x02`: error response
- `0x04`: asynchronous notification (dicadangkan)

Response payload selalu diawali status satu byte. Data command berada setelah status.

## Command

| Command | Request payload | Response data |
|---:|---|---|
| `0x01` Hello | `4F 50` | Device info |
| `0x02` GetInfo | kosong | Device info |
| `0x10` GetKeymap | layer `u8` | count `u8` + 5 action |
| `0x11` SetKeymap | layer `u8` + count `u8` + 5 action | kosong |
| `0x12` GetEncoder | layer `u8` | clockwise + counter-clockwise action |
| `0x13` SetEncoder | layer `u8` + 2 action | kosong |
| `0x20` GetCadSettings | kosong | CAD settings |
| `0x21` SetCadSettings | CAD settings | kosong |
| `0x30` Commit | kosong | kosong |
| `0x31` Discard | kosong | kosong |
| `0x32` ResetDefaults | `4F 50` | kosong |
| `0x33` Verify | kosong | storage generation `u32` |
| `0x40` GetJoystickState | kosong | raw X/Y, tombol, mode, layer |
| `0x7F` Reboot | kosong | kosong, lalu reboot |

Device layout saat ini tetap: 3 layer, 5 tombol, 1 encoder.

## Joystick state encoding

Response data `GetJoystickState` berukuran 8 byte:

- `u16 rawX`
- `u16 rawY`
- `u8 buttonMask`: bit 0–4 BTN1–BTN5, bit 5 joystick switch, bit 6 encoder switch
- `u8 modeFlags`: bit 0 joystick held, bit 1 orbit aktif, bit 2 pan aktif, bit 3 encoder switch held
- `u8 activeLayer`
- `u8 reserved`

AirVIA melakukan polling 10 kali per detik saat koneksi aktif. Nilai ini dipakai untuk diagnosis center, deadzone, drift, tombol joystick, dan mode gesture; tidak mengubah konfigurasi.

## Action encoding

Satu action berukuran 4 byte:

| Offset | Ukuran | Field |
|---:|---:|---|
| 0 | 1 | Type: `0` none, `1` USB HID key, `2` mouse wheel |
| 1 | 2 | USB HID keycode atau signed wheel amount |
| 3 | 1 | Modifier mask: Ctrl `0x01`, Shift `0x02`, Alt `0x04`, GUI `0x08` |

Keycode mengikuti USB HID usage ID, bukan ASCII. Firmware menolak keycode key di atas `0xFF` pada target ATmega32U4 ini.

## CAD settings encoding

Payload settings berukuran 23 byte:

- `u16 centerX`
- `u16 centerY`
- `u16 deadzone`
- `u16 speedMilli`
- `u16 curveMilli`
- `u8 flags`: bit 0 invert X, bit 1 invert Y
- `u16 tapMs`
- `u16 holdMs`
- `u16 encoderTapMs`
- `u16 layerHoldMs`
- `u8 encoderDirection`: `0x01` normal, `0xFF` reverse
- `u8 wheelStep`
- `u8 panModifier`
- `u8 reserved`

`curveMilli=1000` berarti respons linear. Nilai lebih kecil membuat respons lebih halus di sekitar deadzone; nilai lebih besar membuat gerakan awal lebih agresif. Output joystick dibatasi ke rentang mouse HID `-127..127`.

## Persistence

`Commit` menulis dua slot EEPROM bergantian dengan magic, schema, generation, panjang payload, dan CRC. Setelah write firmware membaca ulang slot baru sebelum mengaktifkannya. `Discard` membuang staging config dan mengembalikan data aktif.
