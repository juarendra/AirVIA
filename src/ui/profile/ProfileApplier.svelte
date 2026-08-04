<script lang="ts">
  import { sendViaCommand } from '../../ble/dispatch';
  import { getKeymap, setKeymapAtIndex, getSyncPhase, getDefinition, setEncoderKeycode, setLightingBrightness, setLightingEffect, setLightingSpeed, setLightingHue, setLightingSaturation, setLayoutOptions, getEncoderCount } from '../../store/app.svelte';
  import { Protocol } from '../../core/protocol';
  import { toast } from '../shared/Toast.svelte';
  import type { KeyboardProfile } from '../../store/profile';

  export let profile: KeyboardProfile;
  export let onclose: () => void;
  
  let applying = false;
  let progress = 0;
  let total = 0;
  let failures = 0;

  async function apply() {
    if (getSyncPhase() !== 'ready') {
        toast('Device must be ready to apply a profile', 'error');
        return;
    }
    
    applying = true;
    progress = 0;
    failures = 0;
    
    const definition = getDefinition();
    if (!definition) {
        toast('No layout definition loaded', 'error');
        applying = false;
        return;
    }

    const currentKeymap = getKeymap();
    const rows = definition.matrix.rows;
    const cols = definition.matrix.cols;
    const keymapDiffs: { layer: number, row: number, col: number, code: number, index: number }[] = [];
    
    // Find keymap differences
    for (let i = 0; i < profile.keymap.length; i++) {
        if (i < currentKeymap.length && profile.keymap[i] !== currentKeymap[i]) {
            const layer = Math.floor(i / (rows * cols));
            const rem = i % (rows * cols);
            const row = Math.floor(rem / cols);
            const col = rem % cols;
            keymapDiffs.push({ layer, row, col, code: profile.keymap[i], index: i });
        }
    }

    // Find encoder diffs
    const encoderCount = getEncoderCount();
    const encoderDiffs: { layer: number, id: number, cw: boolean, code: number }[] = [];
    if (profile.encoders && encoderCount > 0) {
        // We do not have getEncoderMap exposed in a way to easily iterate over the store to diff, 
        // wait, I can just apply them or import getEncoderMap. For laziness, just apply all encoders in profile that fit.
        const numLayers = profile.keymap.length / (rows * cols);
        for (let l = 0; l < numLayers; l++) {
            for (let e = 0; e < encoderCount; e++) {
                const baseIdx = l * encoderCount * 2 + e * 2;
                if (baseIdx + 1 < profile.encoders.length) {
                    encoderDiffs.push({ layer: l, id: e, cw: false, code: profile.encoders[baseIdx] });
                    encoderDiffs.push({ layer: l, id: e, cw: true, code: profile.encoders[baseIdx + 1] });
                }
            }
        }
    }

    total = keymapDiffs.length + encoderDiffs.length;
    // Add lighting and layout total if present
    if (profile.lighting) total += 5; // 5 lighting channels
    if (profile.layoutOptions !== undefined) total += 1;
    
    if (total === 0) {
        toast('Profile matches current device state exactly.', 'success');
        applying = false;
        onclose();
        return;
    }

    // Apply keymap
    for (const diff of keymapDiffs) {
        try {
            await sendViaCommand(Protocol.setKeycode(diff.layer, diff.row, diff.col, diff.code >> 8, diff.code & 0xFF));
            setKeymapAtIndex(diff.index, diff.code);
        } catch (e) {
            failures++;
        }
        progress++;
    }

    // Apply encoders
    for (const diff of encoderDiffs) {
         try {
             await sendViaCommand(Protocol.setEncoderKeycode(diff.layer, diff.id, diff.cw ? 1 : 0, diff.code >> 8, diff.code & 0xFF));
             setEncoderKeycode(diff.layer, diff.id, diff.cw, diff.code);
         } catch(e) {
             failures++;
         }
         progress++;
    }

    // Apply lighting
    if (profile.lighting) {
        const chans = [
            { id: 1, val: profile.lighting.brightness, setter: setLightingBrightness },
            { id: 2, val: profile.lighting.effect, setter: setLightingEffect },
            { id: 3, val: profile.lighting.speed, setter: setLightingSpeed },
            { id: 4, val: profile.lighting.hue, setter: setLightingHue },
            { id: 5, val: profile.lighting.saturation, setter: setLightingSaturation }
        ];
        for (const c of chans) {
             try {
                await sendViaCommand(Protocol.setCustomValue(0x08, c.id, Math.floor(c.val / 256), c.val % 256));
                c.setter(c.val);
             } catch(e) { failures++; }
             progress++;
        }
    }

    // Apply Layout Options
    if (profile.layoutOptions !== undefined) {
         try {
             await sendViaCommand(Protocol.setLayoutOptions(profile.layoutOptions));
             setLayoutOptions(profile.layoutOptions);
         } catch(e) { failures++; }
         progress++;
    }

    applying = false;
    if (failures > 0) {
        toast(`Profile applied with ${failures} failures. Partial state saved.`, 'error');
    } else {
        toast('Profile applied successfully.', 'success');
    }
    onclose();
  }
</script>

<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
  <div class="bg-surface rounded-lg shadow-xl max-w-md w-full p-6 flex flex-col gap-4">
    <h3 class="text-lg font-medium">Apply Profile: {profile.name}</h3>
    
    {#if !applying}
      <p class="text-sm text-content-dim">
        This will apply differences from the loaded profile to your keyboard.
      </p>
      
      <div class="flex justify-end gap-2 mt-4">
        <button onclick={onclose} class="px-4 py-2 bg-surface-raised hover:bg-surface-elevated rounded">Cancel</button>
        <button onclick={apply} class="px-4 py-2 bg-primary text-primary-content rounded">Apply</button>
      </div>
    {:else}
      <div class="flex flex-col gap-2">
        <div class="flex justify-between text-sm">
          <span>Applying changes...</span>
          <span>{progress} / {total}</span>
        </div>
        <div class="h-2 bg-surface-raised rounded overflow-hidden">
          <div class="h-full bg-primary transition-all duration-200" style="width: {(progress / Math.max(1, total)) * 100}%"></div>
        </div>
        {#if failures > 0}
          <div class="text-sm text-red-400 mt-1">{failures} failed commands</div>
        {/if}
      </div>
    {/if}
  </div>
</div>