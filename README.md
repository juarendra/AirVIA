# AirVIA

Wireless keyboard configurator for VIA v13 over BLE. Load a V3 JSON definition, connect to your keyboard, and remap keys — no cables needed.

## Usage

1. Open `index.html` in a browser
2. Click **Connect** and pair with your BLE keyboard
3. Load a V3 JSON definition file
4. Edit keymaps, macros, lighting, encoders

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

- Chrome 122+
- Edge 122+
- (Web Bluetooth API required)

## License

MIT
