import { describe, it, expect } from 'vitest';
import {
  classifyKeycode,
  extractBasicUsage,
  extractModifierMask,
  extractQkMods,
  extractLayerAction,
  keycodeLabel,
  KeycodeType,
  KEYCODE_MAP,
  KEYCODES_BY_CATEGORY,
  CATEGORY_LABELS,
  type KeycodeCategory,
} from './keycodes';

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

  it('classifies reserved range 0xE8-0xFF as Unsupported', () => {
    expect(classifyKeycode(0x00E8)).toBe(KeycodeType.Unsupported);
    expect(classifyKeycode(0x00FF)).toBe(KeycodeType.Unsupported);
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
