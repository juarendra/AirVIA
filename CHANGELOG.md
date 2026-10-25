# Changelog

## [Unreleased]
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


## [1.0.0] - 2026-08-04
### Added
- Complete rewrite of BLE transmission utilizing strict queued command matching.
- Protocol compatibility validation guard for VIA v13.
- Dark Control Surface UI.
- Local Profile JSON Export/Import.
- Safe profile application diffing.