# AirVIA

Wireless keyboard configurator for VIA v13 over BLE. Load a V3 JSON definition, connect to your keyboard, and remap keys — no cables needed.

## Try It

**[Launch AirVIA →](https://juarendra.github.io/AirVIA/)**

> Needs Chrome or Edge. Web Bluetooth API not supported in Firefox/Safari.

## Usage

1. Open the [live app](https://juarendra.github.io/AirVIA/) or serve locally.
2. Load a V3 JSON definition file for your keyboard.
3. Click **Connect** and pair with your BLE keyboard.
4. Wait for synchronization to complete.
5. Edit your keymap, encoders, or lighting (if supported).

## Manual Pengguna

A complete 17-section user manual in **Indonesian** is embedded in the app under the "Help" group (desktop sidebar) or "Manual Pengguna" tab (mobile bottom bar). The rest of the UI remains in **English**.

The manual is searchable (title, summary, keywords, and body text) and includes a table of contents with section links. It covers quick start, browser setup, definition files, connection, sync status, keymap, encoder, lighting, layout, macros, profiles, save/apply/verify, disconnect recovery, BLE troubleshooting, definition/profile errors, privacy, and RC limitations.

**Manual, definition loading, and profile management work offline and without Web Bluetooth** — only BLE connection features require a supported browser.

## Privacy and Security

AirVIA is **local-first**. It runs entirely in your browser without a backend.
- Profiles and backups are saved to your local machine.
- No analytics, telemetry, or cloud tracking are used.
- Web Bluetooth requests direct, local pairing only to the VIA service UUID.

## Hardware Support

v1.0.0-rc.1 is protocol-verified via deterministic VIA v13 simulator. Hardware testing pending.

Initial public support is bounded. Features like Encoders, Lighting, Layouts, and Macros will gracefully disable if your specific firmware version does not expose them.

## Development

```sh
pnpm install
pnpm dev          # Vite dev server with HMR
pnpm test         # Vitest unit tests
pnpm build        # Production build to dist/
```

## Architecture

| Layer     | Path     | Role                               |
|-----------|----------|------------------------------------|
| **core**  | `src/core/`  | Protocol encoding, V3 JSON parsing, keycode tables |
| **ble**   | `src/ble/`   | BLE transport, command queue       |
| **store** | `src/store/` | Svelte 5 reactive state            |
| **ui**    | `src/ui/`    | Svelte 5 components                |

## Browser Support

Web Bluetooth (BLE connection, synchronization, and device writes) requires:

- Chrome 122+
- Edge 122+

(Web Bluetooth API is not supported in Firefox or Safari.)

The manual, definition loader, and profile manager work in any modern browser — only BLE features are Chrome/Edge-only.

## License

MIT
