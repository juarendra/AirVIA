export type KeyboardProfile = {
  version: number;
  name: string;
  timestamp: number;
  keymap: number[];
  encoders?: number[];
  lighting?: { brightness: number; effect: number; speed: number; hue: number; saturation: number };
  layoutOptions?: number;
};

export function serializeProfile(profile: KeyboardProfile): string {
  return JSON.stringify(profile, null, 2);
}

export function parseProfile(input: string): KeyboardProfile {
  try {
    const data = JSON.parse(input);
    if (!data || typeof data !== 'object') throw new Error('Invalid profile data');
    if (data.version !== 1) throw new Error('Unsupported profile version');
    if (!Array.isArray(data.keymap)) throw new Error('Invalid keymap array');
    return data as KeyboardProfile;
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === 'Unsupported profile version' || err.message === 'Invalid keymap array')) {
        throw err;
    }
    throw new Error('Invalid profile data');
  }
}
