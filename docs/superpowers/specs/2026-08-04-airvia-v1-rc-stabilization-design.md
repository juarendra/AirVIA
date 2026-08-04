# AirVIA v1.0 RC Stabilization Design

Date: 2026-08-04
Status: Approved

## Goal

Release `v1.0.0-rc.1` as a full-feature release candidate verified by automated tests against a deterministic VIA v13 hardware simulator. Keymap, encoder, lighting, layout, macro, profile application, and persistence must each complete a read, edit, acknowledged write, persist, and re-read cycle.

The RC is simulation-verified, not hardware-verified. Promotion to `v1.0.0` requires acceptance testing on real keyboards and firmware versions.

## Current Baseline

AirVIA is a local-first Svelte 5 Web Bluetooth configurator. The repository already has a serialized command queue, V3 definition parsing, keymap synchronization and editing, profile JSON export/import, capability-oriented UI, CI checks, and a Phase 5 stabilization worktree.

The current code is not release-ready:

- Successful synchronization does not transition the application to `ready`.
- Unexpected disconnects can leave device-derived state looking current.
- Protocol-version validation does not verify keyboard identity.
- Keymap chunk validation does not prove exact, complete coverage.
- Encoder assignments are fabricated as zero-filled values instead of read from the device.
- Lighting, layout, and macro synchronization are incomplete.
- Profile application can partially modify the device without truthful local recovery state.
- Queue timeout exhaustion and response correlation remain unsafe.
- Persistence is tracked globally despite feature-specific commands and channels.
- No real-hardware acceptance evidence exists.

## Release Boundary

`v1.0.0-rc.1` is complete when:

- Session lifecycle is deterministic across connect, sync, ready, failure, disconnect, and reconnect.
- Command dispatch handles exact correlation, malformed responses, retries, timeout exhaustion, write rejection, and disconnect without stranding later requests.
- The simulator models the VIA v13 behavior used across all AirVIA features and supports deterministic fault injection.
- Keymap, encoder, lighting, layout, and macro round trips pass.
- Profile import and application validate compatibility, report partial results, support retry, persist, and verify.
- Editors remain locked unless the session is ready and the feature capability is proven.
- `pnpm check`, `pnpm test`, and `pnpm build` pass.
- Release documentation explicitly states that the RC passed simulated protocol testing but not real-hardware acceptance.

The following remain outside this RC: backend services, accounts, cloud sync, analytics, telemetry, broad untested keyboard claims, and generic transport or emulator frameworks.

## Approach

Use feature-based vertical slices over a shared repaired session and transport foundation.

1. Establish a correct session and command pipeline.
2. Add a deterministic VIA v13 simulator behind the same transport contract.
3. Make synchronization atomic and capability state truthful.
4. Complete one feature at a time through read, edit, write, persist, and verify.
5. Harden profile application and release operations after feature round trips are reliable.

The simulator should cover VIA v13 broadly enough for AirVIA's full feature set, but it grows through commands exercised by real product flows. It will not become an unrelated general-purpose VIA framework.

## Architecture

```text
Svelte UI
  -> application/session state
  -> device synchronizer
  -> serialized dispatcher
  -> transport contract
       -> Web Bluetooth transport
       -> VIA v13 simulator
```

Preserve the existing repository structure and avoid a rewrite. Introduce only the smallest shared transport boundary needed to run identical command flows against Web Bluetooth and the simulator.

### Session State

The application owns one explicit lifecycle:

```text
disconnected -> connecting -> syncing -> ready
                    |            |         |
                    +----------> error <---+
                                             \
                                              -> stale on disconnect
```

- `ready` is reached only after a complete validated snapshot is committed.
- A failed mandatory synchronization leaves editors locked.
- An unexpected disconnect immediately makes all device-derived state stale and locks writes.
- Reconnect performs a fresh synchronization; stale values never silently become authoritative.
- Definition changes invalidate the current session and require compatibility and state checks again.

### Dispatcher and Transport

Only one request may be active. Every request defines its expected response shape, including command, subcommand, offset, and length where applicable.

The dispatcher must:

- Honor the requested timeout.
- Retry only retryable failures with a bounded count.
- Reject malformed and unrelated notifications.
- Reject device error frames with useful command context.
- Continue with the next queued request after success or terminal failure.
- Cancel the active and queued requests on disconnect.
- Record both transmitted and received packets for diagnostics.

The transport only moves bytes and reports connection changes. Command matching and decoding remain in the dispatcher/request layer so Web Bluetooth and simulator behavior stay identical.

### Simulator

The simulator implements an in-memory virtual VIA v13 device with configurable identity, protocol version, matrix, layers, encoders, lighting channels, layout options, macro metadata and buffer, and persisted state.

It accepts the same raw packets as Web Bluetooth and emits the same notification packets. It supports deterministic scenarios:

- Normal response.
- Wrong command or subcommand.
- Wrong offset or size.
- Short, odd, or malformed packet.
- Device error frame.
- Write rejection.
- One timeout followed by success.
- Retry exhaustion.
- Disconnect during an active command.
- Disconnect during synchronization.
- Persistence mismatch after re-read.

Tests configure scenarios directly. No production UI for simulator controls is required for the RC.

## Synchronization

Synchronization builds a temporary snapshot and commits it atomically:

1. Validate the loaded V3 definition.
2. Read and validate protocol version.
3. Establish identity status from available firmware data. Protocol version alone is not identity proof.
4. Read layer count and validate it against safe bounds.
5. Read every keymap chunk with exact command, offset, requested size, even-byte, and contiguous-coverage validation.
6. Read encoder assignments when supported.
7. Read lighting state and supported controls when supported.
8. Read layout options when supported.
9. Read macro metadata and complete macro buffer when supported.
10. Validate the complete snapshot.
11. Commit once and transition to `ready`.

Mandatory failure rejects the whole snapshot. Optional feature failure marks only that feature unavailable or read-only. The application never fills missing device values with plausible defaults.

Identity that cannot be proven in the current protocol must be represented as unverified. Writes stay locked unless a deliberate compatibility policy is satisfied; documentation must not call protocol-version checks device identity validation.

## Feature Round Trips

Every writable feature follows the same user-visible contract:

```text
authoritative read -> local draft -> acknowledged write
  -> feature-specific persist -> re-read -> verified state
```

Local authoritative state changes only after acknowledgment. Failed writes remain visible and retryable. Persistence success is not claimed until re-read matches the intended value.

### Keymap

- Synchronize exact keymap coverage for every layer.
- Validate layer, row, column, and keycode bounds.
- Send acknowledged per-key writes serially.
- Track pending and failed keys independently.
- Re-read affected positions after persistence.

### Encoders

- Read clockwise and counter-clockwise assignments from the device.
- Never derive support solely from definition count.
- Validate encoder index and layer bounds.
- Write and verify each assignment independently.

### Lighting

- Read supported lighting controls and current values.
- Keep debounce per control so one slider cannot cancel another control's write.
- Do not update authoritative values before acknowledgment.
- Persist and re-read the affected lighting channels.

### Layout Options

- Read the current raw layout value before enabling controls.
- Preserve unknown bits when changing named options.
- Validate writes and re-read the raw value after persistence.

### Macros

- Read macro count, buffer size, and complete buffer.
- Parse only a proven supported firmware format.
- Provide full draft editing with size and terminator validation.
- Write changed chunks serially, persist, and re-read the buffer.
- Fall back to read-only raw diagnostics when a format is not recognized; never guess a writable encoding.

## Profiles

Profile parsing is a trust boundary. Validate schema version, identity metadata, keymap dimensions, layer count, every numeric value, collection limits, macro size, and supported feature payloads before showing an apply action.

Applying a profile requires a connected, ready, compatible session:

1. Compare the profile with the authoritative device snapshot.
2. Show a per-feature diff and unsupported values.
3. Apply differences serially through normal feature command paths.
4. Update acknowledged items while retaining explicit failed items.
5. Allow retry of only failed or unapplied items.
6. Persist successful feature channels.
7. Re-read and report verified, failed, and mismatched results.

A partial apply is never reported as complete. The UI and device snapshot must represent successful mutations even if a later item fails.

## Error Handling

No silent catches are allowed for BLE commands, definition/profile import, feature apply, persistence, or verification.

- Transient information uses toast messages.
- Feature failures remain inline and retryable.
- Disconnect, compatibility, synchronization, and persistence failures use persistent status.
- Technical packet and command context goes to the packet log.
- User messages remain concise and include a recovery action.
- One failed command cannot block later queued work.

## Verification

Automated release gates are sufficient for `v1.0.0-rc.1`:

- Unit tests for packet builders, decoders, exact matchers, and profile validation.
- Transport/dispatcher tests for write failure, malformed response, retry, timeout exhaustion, continuation, and disconnect.
- Synchronizer tests for complete snapshots, exact chunk validation, optional capabilities, atomic rejection, and ready transition.
- Feature round-trip tests for keymap, encoder, lighting, layout, and macro.
- Profile tests for compatibility rejection, successful apply, partial failure, retry, persistence, and verification mismatch.
- One rendered application workflow against the simulator: load definition, connect, synchronize, reach ready, edit every supported feature, persist, verify, disconnect, reconnect, and recover.
- Production gates: `pnpm check`, `pnpm test`, and `pnpm build`.

Copied reimplementations of production logic do not count as release evidence. Tests must exercise production modules or rendered components.

## Delivery Sequence

### Phase 1: Preserve and Correct Baseline

- Retain valid Phase 5 work while withholding unsafe profile apply and premature `1.0.0` metadata.
- Set release version to `1.0.0-rc.1` only at the release step.
- Commit planning documents so recovery does not depend on an editor session.

Exit: known work is preserved and release claims match implemented behavior.

### Phase 2: Session and Command Foundation

- Repair `ready`, stale, disconnect, and reconnect transitions.
- Strengthen correlation, decoding, timeout, retry, queue continuation, and TX/RX logging.

Exit: fault tests prove one command failure cannot corrupt or strand later commands.

### Phase 3: VIA v13 Simulator

- Implement virtual device state and command handlers.
- Add deterministic error, timeout, malformed-response, persistence, and disconnect scenarios.

Exit: production dispatcher can run unchanged against simulator and Web Bluetooth transports.

### Phase 4: Atomic Full Synchronization

- Enforce exact keymap chunk coverage.
- Replace fabricated encoder state with real reads.
- Read lighting, layout, and macro state.
- Commit a complete snapshot atomically and expose truthful capabilities.

Exit: the simulator produces a complete authoritative ready state; malformed mandatory data cannot partially commit.

### Phase 5: Feature Vertical Slices

- Complete keymap round trip.
- Complete encoder round trip.
- Complete lighting round trip.
- Complete layout round trip.
- Complete macro editor and round trip.

Exit: each feature independently passes normal, failure, persistence, and re-read tests.

### Phase 6: Profiles and Recovery

- Harden profile schema and compatibility validation.
- Implement per-feature diff, serial application, partial-result recovery, persistence, and re-read verification.

Exit: malformed profiles cannot issue commands and partial application remains truthful and retryable.

### Phase 7: RC Release

- Run the complete simulated application workflow.
- Update README, changelog, security policy, license, compatibility claims, and release limitations.
- Set version `1.0.0-rc.1`.
- Run all automated gates.
- Tag `v1.0.0-rc.1` only from the verified commit.

Exit: CI artifacts and documentation agree with the simulation-verified RC scope.

## Final Release Gate

`v1.0.0` remains blocked until real keyboards pass connection, complete synchronization, every supported feature round trip, power-cycle persistence, disconnect/reconnect recovery, wrong-definition protection, and profile apply/recovery. Results must identify keyboard model and firmware version in a committed compatibility matrix.
