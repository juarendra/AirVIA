export type AppDestination = 'keymap' | 'encoder' | 'lighting' | 'macros' | 'profiles' | 'layout' | 'actions' | 'console' | 'manual';

export type DestinationItem = { id: AppDestination; label: string; icon: string; title: string; description: string };

const META: Record<AppDestination, Pick<DestinationItem, 'label' | 'icon' | 'title' | 'description'>> = {
  keymap: { label: 'Keymap', icon: 'keyboard', title: 'Keymap Editor', description: 'Assign keycodes to each key on the matrix' },
  encoder: { label: 'Encoder', icon: 'settings', title: 'Encoder Configuration', description: 'Configure rotary encoder actions' },
  lighting: { label: 'Lighting', icon: 'sun', title: 'Lighting Control', description: 'Adjust brightness, effect, and color' },
  macros: { label: 'Macros', icon: 'terminal', title: 'Macro Editor', description: 'Record and edit macro sequences' },
  profiles: { label: 'Profiles', icon: 'profile', title: 'Profile Manager', description: 'Save and restore configuration profiles' },
  layout: { label: 'Layout', icon: 'layers', title: 'Layout Options', description: 'Configure layout options and key behavior' },
  actions: { label: 'Actions', icon: 'trash', title: 'Device Actions', description: 'Reset, bootloader, and device tools' },
  console: { label: 'Console', icon: 'terminal', title: 'Debug Console', description: 'Packet log and debug output' },
  manual: { label: 'Manual Pengguna', icon: 'help', title: 'Manual Pengguna', description: 'User manual and documentation' },
};

export const navigationGroups = [
  { label: 'Configure', items: ['keymap', 'encoder', 'lighting', 'macros'] },
  { label: 'Workspace', items: ['profiles', 'layout'] },
  { label: 'Advanced', items: ['actions', 'console'] },
  { label: 'Help', items: ['manual'] },
] as const;

export function destinationById(id: AppDestination): DestinationItem | undefined {
  const meta = META[id];
  return meta ? { id, ...meta } : undefined;
}

const resolve = (ids: AppDestination[]): DestinationItem[] =>
  ids.map(id => destinationById(id)!).filter(Boolean);

export const primaryMobileDestinations: DestinationItem[] = resolve(['keymap', 'encoder', 'lighting', 'macros', 'manual']);

export const advancedMobileDestinations: DestinationItem[] = resolve(['profiles', 'layout', 'actions', 'console']);
