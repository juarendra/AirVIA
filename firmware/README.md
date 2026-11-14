# OrthoPad firmware

PlatformIO firmware target untuk Arduino Pro Micro / ATmega32U4 5 V/16 MHz.

## Build

```sh
pio run -e promicro5v
pio run -e diagnostic
```

## Upload

```sh
pio run -e promicro5v -t upload
```

Board baseline: `sparkfun_promicro16`. Verifikasi board clone dan upload port sebelum flashing.

## Modes

- `promicro5v`: production HID + binary WebSerial protocol.
- `diagnostic`: serial text input monitor; tidak dipakai sebagai configurator production.

Production protocol frame dan command contract didokumentasikan di `protocol.md`.
