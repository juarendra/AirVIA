/// <reference types="vitest" />

export type KeycodeCategory = 'basic' | 'modifier' | 'layer' | 'boot' | 'media' | 'system' | 'macro' | 'custom';

export interface KeycodeEntry {
  code: number;
  label: string;
  category: KeycodeCategory;
}

export enum KeycodeType {
  None = 0,
  Transparent = 1,
  Basic = 2,
  Modifier = 3,
  Layer = 4,
  Boot = 5,
  Unsupported = 0xFF,
}

export function classifyKeycode(code: number): KeycodeType {
  if (code === 0x0000) return KeycodeType.None;
  if (code === 0x0001) return KeycodeType.Transparent;
  if (code >= 0x0004 && code <= 0x00FF) {
    if (code >= 0xE0 && code <= 0xE7) return KeycodeType.Modifier;
    return KeycodeType.Basic;
  }
  if (code >= 0x0100 && code < 0x2000) return KeycodeType.Modifier;
  if ((code & 0xFF00) === 0x5200) return KeycodeType.Layer;
  if (code === 0x7C00) return KeycodeType.Boot;
  return KeycodeType.Unsupported;
}

export function extractBasicUsage(code: number): number {
  return code & 0xFF;
}

export function extractModifierMask(code: number): number {
  if (code >= 0xE0 && code <= 0xE7) return code - 0xE0;
  return (code >> 8) & 0x1F;
}

export function extractQkMods(code: number): { hidUsage: number; modMask: number } | null {
  if (code < 0x0100 || code >= 0x2000) return null;
  return { hidUsage: code & 0xFF, modMask: (code >> 8) & 0x1F };
}

export function extractLayerAction(code: number): { action: number; layer: number } | null {
  if ((code & 0xFF00) !== 0x5200) return null;
  return { action: (code >> 5) & 0x0F, layer: code & 0x1F };
}

function buildEntries(): KeycodeEntry[] {
  const e: KeycodeEntry[] = [];

  for (let i = 0; i < 26; i++) {
    e.push({ code: 0x0004 + i, label: `KC_${String.fromCharCode(65 + i)}`, category: 'basic' });
  }

  for (let i = 0; i < 10; i++) {
    e.push({ code: 0x001E + i, label: `KC_${(i + 1) % 10}`, category: 'basic' });
  }

  for (let i = 0; i < 12; i++) {
    e.push({ code: 0x003A + i, label: `KC_F${i + 1}`, category: 'basic' });
  }

  for (let i = 0; i < 12; i++) {
    e.push({ code: 0x0068 + i, label: `KC_F${i + 13}`, category: 'basic' });
  }

  const navKeys: [number, string][] = [
    [0x0028, 'KC_ENTER'],
    [0x0029, 'KC_ESCAPE'],
    [0x002A, 'KC_BSPACE'],
    [0x002B, 'KC_TAB'],
    [0x002C, 'KC_SPACE'],
    [0x002D, 'KC_MINUS'],
    [0x002E, 'KC_EQUAL'],
    [0x002F, 'KC_LBRACKET'],
    [0x0030, 'KC_RBRACKET'],
    [0x0031, 'KC_BSLASH'],
    [0x0033, 'KC_SCOLON'],
    [0x0034, 'KC_QUOTE'],
    [0x0035, 'KC_GRAVE'],
    [0x0036, 'KC_COMMA'],
    [0x0037, 'KC_DOT'],
    [0x0038, 'KC_SLASH'],
    [0x0039, 'KC_CAPSLOCK'],
    [0x0046, 'KC_PSCREEN'],
    [0x0047, 'KC_SCROLLLOCK'],
    [0x0048, 'KC_PAUSE'],
    [0x0049, 'KC_INSERT'],
    [0x004A, 'KC_HOME'],
    [0x004B, 'KC_PGUP'],
    [0x004C, 'KC_DELETE'],
    [0x004D, 'KC_END'],
    [0x004E, 'KC_PGDOWN'],
    [0x004F, 'KC_RIGHT'],
    [0x0050, 'KC_LEFT'],
    [0x0051, 'KC_DOWN'],
    [0x0052, 'KC_UP'],
    [0x0053, 'KC_NUMLOCK'],
    [0x0064, 'KC_NONUS_BSLASH'],
    [0x0065, 'KC_APPLICATION'],
  ];
  for (const [code, label] of navKeys) {
    e.push({ code, label, category: 'basic' });
  }

  e.push({ code: 0x0054, label: 'KC_KP_SLASH', category: 'basic' });
  e.push({ code: 0x0055, label: 'KC_KP_ASTERISK', category: 'basic' });
  e.push({ code: 0x0056, label: 'KC_KP_MINUS', category: 'basic' });
  e.push({ code: 0x0057, label: 'KC_KP_PLUS', category: 'basic' });
  e.push({ code: 0x0058, label: 'KC_KP_ENTER', category: 'basic' });
  for (let i = 0; i < 10; i++) {
    e.push({ code: 0x0059 + i, label: `KC_KP_${(i + 1) % 10}`, category: 'basic' });
  }
  e.push({ code: 0x0063, label: 'KC_KP_DOT', category: 'basic' });
  e.push({ code: 0x0067, label: 'KC_KP_EQUAL', category: 'basic' });

  const modKeys: [number, string][] = [
    [0x00E0, 'KC_LCTL'],
    [0x00E1, 'KC_LSFT'],
    [0x00E2, 'KC_LALT'],
    [0x00E3, 'KC_LGUI'],
    [0x00E4, 'KC_RCTL'],
    [0x00E5, 'KC_RSFT'],
    [0x00E6, 'KC_RALT'],
    [0x00E7, 'KC_RGUI'],
  ];
  for (const [code, label] of modKeys) {
    e.push({ code, label, category: 'modifier' });
  }

  const mediaKeys: [number, string][] = [
    [0x0082, 'KC_MUTE'],
    [0x0083, 'KC_VOLU'],
    [0x0084, 'KC_VOLD'],
    [0x00B5, 'KC_MNXT'],
    [0x00B6, 'KC_MPRV'],
    [0x00B7, 'KC_MSTP'],
    [0x00CD, 'KC_MPLY'],
  ];
  for (const [code, label] of mediaKeys) {
    e.push({ code, label, category: 'media' });
  }

  e.push({ code: 0x0066, label: 'KC_POWER', category: 'system' });

  const layerActions: [string, number][] = [['MO', 0], ['TG', 1], ['TO', 2], ['DF', 3]];
  for (const [prefix, action] of layerActions) {
    for (let n = 0; n < 32; n++) {
      e.push({ code: 0x5200 | (action << 5) | n, label: `${prefix}(${n})`, category: 'layer' });
    }
  }

  e.push({ code: 0x7C00, label: 'QK_BOOT', category: 'boot' });
  e.push({ code: 0x0000, label: 'KC_NO', category: 'basic' });
  e.push({ code: 0x0001, label: 'KC_TRNS', category: 'basic' });

  return e;
}

const _entries = buildEntries();

const _map = new Map<number, KeycodeEntry>();
const _byCategory: Record<KeycodeCategory, KeycodeEntry[]> = {
  basic: [],
  modifier: [],
  layer: [],
  boot: [],
  media: [],
  system: [],
  macro: [],
  custom: [],
};
for (const entry of _entries) {
  _map.set(entry.code, entry);
  _byCategory[entry.category].push(entry);
}

export const KEYCODE_MAP: ReadonlyMap<number, KeycodeEntry> = _map;
export const KEYCODES_BY_CATEGORY: Readonly<Record<KeycodeCategory, KeycodeEntry[]>> = _byCategory;

export const CATEGORY_LABELS: Record<KeycodeCategory, string> = {
  basic: 'Basic',
  modifier: 'Modifier',
  layer: 'Layer',
  boot: 'Boot',
  media: 'Media',
  system: 'System',
  macro: 'Macro',
  custom: 'Custom',
};

export function keycodeLabel(code: number): string {
  const entry = KEYCODE_MAP.get(code);
  if (entry) return entry.label;
  const qkMods = extractQkMods(code);
  if (qkMods) {
    const baseEntry = KEYCODE_MAP.get(qkMods.hidUsage);
    const baseLabel = baseEntry ? baseEntry.label : `0x${qkMods.hidUsage.toString(16).toUpperCase().padStart(4, '0')}`;
    return `${baseLabel}(MOD ${qkMods.modMask})`;
  }
  return `0x${code.toString(16).toUpperCase().padStart(4, '0')}`;
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe('classifyKeycode', () => {
    it('classifies KC_NO as None', () => {
      expect(classifyKeycode(0x0000)).toBe(KeycodeType.None);
    });

    it('classifies KC_TRNS as Transparent', () => {
      expect(classifyKeycode(0x0001)).toBe(KeycodeType.Transparent);
    });

    it('classifies basic keycodes', () => {
      expect(classifyKeycode(0x0004)).toBe(KeycodeType.Basic);
      expect(classifyKeycode(0x0028)).toBe(KeycodeType.Basic);
      expect(classifyKeycode(0x0058)).toBe(KeycodeType.Basic);
      expect(classifyKeycode(0x0082)).toBe(KeycodeType.Basic);
    });

    it('classifies raw modifiers in basic range', () => {
      expect(classifyKeycode(0x00E0)).toBe(KeycodeType.Modifier);
    });

    it('classifies QK_MODS as Modifier', () => {
      expect(classifyKeycode(0x0104)).toBe(KeycodeType.Modifier);
    });

    it('classifies layer codes', () => {
      expect(classifyKeycode(0x5200)).toBe(KeycodeType.Layer);
      expect(classifyKeycode(0x521F)).toBe(KeycodeType.Layer);
      expect(classifyKeycode(0x5260)).toBe(KeycodeType.Layer);
      expect(classifyKeycode(0x52FF)).toBe(KeycodeType.Layer);
    });

    it('classifies QK_BOOT as Boot', () => {
      expect(classifyKeycode(0x7C00)).toBe(KeycodeType.Boot);
    });

    it('classifies unknown as Unsupported', () => {
      expect(classifyKeycode(0x9999)).toBe(KeycodeType.Unsupported);
    });
  });

  describe('extractBasicUsage', () => {
    it('returns lower byte', () => {
      expect(extractBasicUsage(0x0004)).toBe(0x04);
      expect(extractBasicUsage(0x00E0)).toBe(0xE0);
      expect(extractBasicUsage(0x0104)).toBe(0x04);
    });
  });

  describe('extractModifierMask', () => {
    it('returns bit position for raw modifiers', () => {
      expect(extractModifierMask(0x00E0)).toBe(0);
      expect(extractModifierMask(0x00E1)).toBe(1);
      expect(extractModifierMask(0x00E4)).toBe(4);
    });

    it('returns mask byte for QK_MODS', () => {
      expect(extractModifierMask(0x0104)).toBe(1);
      expect(extractModifierMask(0x0304)).toBe(3);
    });
  });

  describe('extractQkMods', () => {
    it('returns null for non-QK_MODS range', () => {
      expect(extractQkMods(0x0004)).toBeNull();
      expect(extractQkMods(0x00E0)).toBeNull();
    });

    it('splits QK_MODS into hidUsage and modMask', () => {
      expect(extractQkMods(0x0104)).toEqual({ hidUsage: 0x04, modMask: 1 });
      expect(extractQkMods(0x0328)).toEqual({ hidUsage: 0x28, modMask: 3 });
    });
  });

  describe('extractLayerAction', () => {
    it('returns null for non-layer codes', () => {
      expect(extractLayerAction(0x0004)).toBeNull();
      expect(extractLayerAction(0x00E0)).toBeNull();
    });

    it('splits layer action and layer number', () => {
      expect(extractLayerAction(0x5200)).toEqual({ action: 0, layer: 0 });
      expect(extractLayerAction(0x5260)).toEqual({ action: 3, layer: 0 });
      expect(extractLayerAction(0x5221)).toEqual({ action: 1, layer: 1 });
      expect(extractLayerAction(0x52FF)).toEqual({ action: 7, layer: 31 });
    });
  });

  describe('keycodeLabel', () => {
    it('returns label for letters', () => {
      expect(keycodeLabel(0x0004)).toBe('KC_A');
      expect(keycodeLabel(0x001D)).toBe('KC_Z');
    });

    it('returns label for numbers', () => {
      expect(keycodeLabel(0x001E)).toBe('KC_1');
      expect(keycodeLabel(0x0027)).toBe('KC_0');
    });

    it('returns label for function keys', () => {
      expect(keycodeLabel(0x003A)).toBe('KC_F1');
      expect(keycodeLabel(0x0073)).toBe('KC_F24');
    });

    it('returns label for nav keys', () => {
      expect(keycodeLabel(0x0028)).toBe('KC_ENTER');
      expect(keycodeLabel(0x0029)).toBe('KC_ESCAPE');
    });

    it('returns label for modifiers', () => {
      expect(keycodeLabel(0x00E0)).toBe('KC_LCTL');
      expect(keycodeLabel(0x00E7)).toBe('KC_RGUI');
    });

    it('returns label for media keys', () => {
      expect(keycodeLabel(0x0082)).toBe('KC_MUTE');
      expect(keycodeLabel(0x00CD)).toBe('KC_MPLY');
    });

    it('returns label for system key', () => {
      expect(keycodeLabel(0x0066)).toBe('KC_POWER');
    });

    it('returns label for layer codes', () => {
      expect(keycodeLabel(0x5200)).toBe('MO(0)');
      expect(keycodeLabel(0x521F)).toBe('MO(31)');
      expect(keycodeLabel(0x5260)).toBe('DF(0)');
    });

    it('returns label for boot', () => {
      expect(keycodeLabel(0x7C00)).toBe('QK_BOOT');
    });

    it('returns label for KC_NO and KC_TRNS', () => {
      expect(keycodeLabel(0x0000)).toBe('KC_NO');
      expect(keycodeLabel(0x0001)).toBe('KC_TRNS');
    });

    it('returns hex fallback for unknown codes', () => {
      expect(keycodeLabel(0x9999)).toBe('0x9999');
    });
  });

  describe('KEYCODE_MAP coverage', () => {
    it('has all letters A-Z', () => {
      for (let i = 0; i < 26; i++) {
        expect(KEYCODE_MAP.has(0x0004 + i)).toBe(true);
      }
    });

    it('has all numbers 1-0', () => {
      for (let i = 0; i < 10; i++) {
        expect(KEYCODE_MAP.has(0x001E + i)).toBe(true);
      }
    });

    it('has all F1-F24', () => {
      for (let i = 0; i < 12; i++) expect(KEYCODE_MAP.has(0x003A + i)).toBe(true);
      for (let i = 0; i < 12; i++) expect(KEYCODE_MAP.has(0x0068 + i)).toBe(true);
    });

    it('has all numpad keys', () => {
      expect(KEYCODE_MAP.has(0x0054)).toBe(true);
      expect(KEYCODE_MAP.has(0x0055)).toBe(true);
      expect(KEYCODE_MAP.has(0x0056)).toBe(true);
      expect(KEYCODE_MAP.has(0x0057)).toBe(true);
      expect(KEYCODE_MAP.has(0x0058)).toBe(true);
      for (let i = 0; i < 10; i++) expect(KEYCODE_MAP.has(0x0059 + i)).toBe(true);
      expect(KEYCODE_MAP.has(0x0063)).toBe(true);
      expect(KEYCODE_MAP.has(0x0067)).toBe(true);
    });

    it('has all layer codes MO/TG/TO/DF for layers 0-31', () => {
      for (const action of [0, 1, 2, 3]) {
        for (let n = 0; n < 32; n++) {
          expect(KEYCODE_MAP.has(0x5200 | (action << 5) | n)).toBe(true);
        }
      }
    });
  });

  describe('KEYCODES_BY_CATEGORY', () => {
    it('groups entries by category', () => {
      expect(KEYCODES_BY_CATEGORY.basic.length).toBeGreaterThan(0);
      expect(KEYCODES_BY_CATEGORY.modifier.length).toBe(8);
      expect(KEYCODES_BY_CATEGORY.layer.length).toBe(128);
      expect(KEYCODES_BY_CATEGORY.boot.length).toBe(1);
      expect(KEYCODES_BY_CATEGORY.media.length).toBe(7);
      expect(KEYCODES_BY_CATEGORY.system.length).toBe(1);
      expect(KEYCODES_BY_CATEGORY.macro.length).toBe(0);
      expect(KEYCODES_BY_CATEGORY.custom.length).toBe(0);
    });

    it('has all categories in CATEGORY_LABELS', () => {
      const cats: KeycodeCategory[] = ['basic', 'modifier', 'layer', 'boot', 'media', 'system', 'macro', 'custom'];
      for (const cat of cats) {
        expect(CATEGORY_LABELS[cat]).toBeTruthy();
      }
    });
  });
}
