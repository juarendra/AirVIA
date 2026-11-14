# Changelog

## Unreleased
### Added
- OrthoPad Web Serial configurator in `src/App.svelte`, `src/serial/transport.ts`, `src/device/orthopad.ts`, `src/store/orthopad.svelte.ts`, and `src/ui/orthopad/OrthoPadWorkspace.svelte`.
- PlatformIO Pro Micro firmware, EEPROM persistence, CAD input handling, HID output, and protocol documentation in `firmware/`.
- OrthoPad protocol and backend regression tests in `src/core/orthopad-protocol.test.ts` and `src/device/orthopad.test.ts`.
- Encoder tester telemetry and firmware logical joystick axis swap.
- Joystick monitor polling raised to 20 Hz with client-side position interpolation.
- Legacy 8-byte telemetry compatibility so joystick monitor remains usable before firmware `0.3.0`.
- Invert X/Y is now reflected by the effective-position dot while raw ADC remains visible.
- Default joystick deadzone lowered to `30` in firmware and AirVIA defaults.
### Verification
- `svelte-check`, `tsc --noEmit`, and Vitest: 24 files, 204 tests passed.
- PlatformIO `promicro5v` and `diagnostic`: both build successfully with axis swap and encoder telemetry.
### Impact and rollback
- Adds a separate OrthoPad USB flow; existing BLE/VIA flow remains available.
- Roll back by reverting the Unreleased changes and removing the OrthoPad files listed above.

## [1.0.0] - 2026-08-04
### Added
- Complete rewrite of BLE transmission utilizing strict queued command matching.
- Protocol compatibility validation guard for VIA v13.
- Dark Control Surface UI.
- Local Profile JSON Export/Import.
- Safe profile application diffing.