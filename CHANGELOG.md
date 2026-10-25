# Changelog

## [Unreleased]
### Fixed
- Recover the keymap workspace after Disconnect without a page refresh.
  `src/App.svelte` scopes callbacks/results to the active session and
  cancels old synchronization; `src/device/synchronizer.ts` accepts an
  AbortSignal and stops stale requests/results. `src/store/app.svelte.ts`
  preserves the last read-only snapshot on disconnect and clears old
  keys/macros/selection only for a replacement snapshot or definition.
- `src/ble/transport.ts` detaches listeners, rejects queued requests and
  stops FF61 notifications; `src/env.d.ts` describes those native APIs.
  Disconnect ends the VIA configuration session, not Windows keyboard
  pairing. Native GATT is retained until page close: a real Windows test
  resolved GATT reconnect but stalled in getPrimaryService after native
  close. This documented workaround avoids invalidating the shared link.
  `src/ui/ConnectBar.svelte` shows VIA disconnected and blocks reconnect
  until notification teardown completes; teardown failures stay visible.
- `src/ui/keymap/KeymapGrid.svelte` and `KeymapCell.svelte` retain visible
  labels with native-disabled editing offline. `src/ui/manual/manual-content.ts`
  documents session-only disconnect and browser-link lifetime.
  Lifecycle regressions replace setter/mock-echo checks in
  `src/ble/transport.test.ts`, `src/device/synchronizer.test.ts` and
  `src/store/app.svelte.test.ts`.
- Evidence: two lifecycle regressions failed before correction; final
  22 files/192 tests passed, type-check0 errors/0 warnings and production
  build passed. Real Chrome/ESP32 completed two Disconnect/Connect cycles
  on the same page marker, retaining all90 keycodes, read-only offline,
  Ready/VIA13/0 changes after reconnect. No firmware flash or keymap write.
  Impact: refresh is no longer needed for same-page VIA reconnect.
  Limit: independent-client FF61 access while browser GATT is retained
  failed; after closing the AirVIA page, an independent client read VIA13
  and all180 keymap bytes with the same SHA256. Same-page full native
  close/reopen and cross-client handoff without closing the page are not PASS.
  Rollback: restore the prior APP build without modifying device storage;
  it restores the reported refresh requirement.

### Documentation
- Update `docs/testing/esp32-wroom-2026-10-20.md` and
  `docs/plans/2026-10-20-airvia-firmware-readiness-checklist.md` with WROOM
  GPIO-polarity/HOGP framing corrections, non-strapping wiring and the
  distinction between electrical matrix detection and host keyboard acceptance.
  Evidence: firmware native regressions and shared-path ASan/UBSan passed;
  corrected image flashed with verified hashes, boot and BLE/VIA13 read
  observed. Impact: old `0x3f/0x3d` raw readings are not typing PASS; full-pin
  sweep stopped per user direction without closing production gates.
  Rollback: restore prior documentation only; this entry changes no APP runtime.
- Record real authenticated WROOM OTA bench acceptance (2026-10-25) in the
  same testing/checklist documents: IOTech1/IP192.168.1.103, wrong password
  rejected, IP upload exit0, reboot app0->app1 with matching image MD5,
  post-OTA VIA13 and saved keymap intact. This same-image smoke does not
  close keyboard typing, update migration, power-loss or production gates.
- Record user-confirmed WROOM keymap editing and physical keypress success
  (2026-10-25) in `docs/testing/esp32-wroom-2026-10-20.md` and master
  checklist WB04. Evidence: the user's successful manual test, separate
  from the automated UI remap/save/readback/restore smoke. Impact: basic
  remap-to-physical-key behavior is accepted on the current bench fixture;
  key-up timing, all switches, rollover and power-loss remain unmeasured.
  No application runtime changes or device configuration reset.
- Track the subsequent user-reported failure of Notepad typing while
  AirVIA is Connected in `docs/testing/esp32-wroom-2026-10-20.md` and
  master checklist WB08. Earlier separate remap/typing PASS is not a
  concurrent-operation PASS. FW now retains rejected HID reports for
  retry; regression failed-before/passed-after, current candidate OTA
  boot and all90 saved keycodes verified. Physical concurrent acceptance
  remains pending. No APP runtime change; rollback is documentation-only.
- Record that the HID-retry-only candidate did not solve the user's
  concurrent typing failure. Firmware now restarts advertising after
  connect while capacity remains: actual Windows paired/connected,
  HID1812+FF60 scan visibility and Chrome AirVIA Connected/Ready/VIA13
  coexisted. Update testing evidence and WB08b; keep physical Notepad
  typing acceptance open. No APP runtime or keymap changes; documentation
  rollback does not change firmware behavior.
- User subsequently confirmed simultaneous Windows typing and mutual
  Windows/AirVIA discovery solved on firmware53591b7c; WB08 is manual
  user PASS, separate from automated UI/discovery evidence.


## [1.0.0] - 2026-08-04
### Added
- Complete rewrite of BLE transmission utilizing strict queued command matching.
- Protocol compatibility validation guard for VIA v13.
- Dark Control Surface UI.
- Local Profile JSON Export/Import.
- Safe profile application diffing.