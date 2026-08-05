<script lang="ts">
  import { getLighting, setLightingBrightness, setLightingEffect, setLightingSpeed, setLightingHue, setLightingSaturation, markDirty } from '../../store/app.svelte';
  import { Protocol } from '../../core/protocol';
  import { sendViaCommand } from '../../ble/dispatch';
  import { onDestroy } from 'svelte';

  let timers: Record<string, ReturnType<typeof setTimeout>> = {};

  async function syncLightValue(channel: number, v1: number, v2: number, commitLocalState: () => void, key: string) {
    if (timers[key]) clearTimeout(timers[key]);
    timers[key] = setTimeout(async () => {
      try {
        await sendViaCommand(Protocol.setCustomValue(channel, v1, v2));
        commitLocalState();
        markDirty();
      } catch (err) {
        console.error('Lighting sync failed', err);
      }
    }, 150);
  }

  onDestroy(() => {
    for (const key of Object.keys(timers)) {
      clearTimeout(timers[key]);
    }
  });

  const lighting = $derived(getLighting());

  const sliders = [
    { key: 'brightness', label: 'Brightness', min: 0, max: 255, get: () => lighting?.brightness ?? 0, set: (v: number) => { syncLightValue(0x01, v, 0, () => setLightingBrightness(v), 'brightness'); } },
    { key: 'effect',     label: 'Effect',     min: 0, max: 20,  get: () => lighting?.effect ?? 0,     set: (v: number) => { syncLightValue(0x02, v, 0, () => setLightingEffect(v), 'effect'); } },
    { key: 'speed',      label: 'Speed',      min: 0, max: 255, get: () => lighting?.speed ?? 0,      set: (v: number) => { syncLightValue(0x03, v, 0, () => setLightingSpeed(v), 'speed'); } },
    { key: 'hue',        label: 'Hue',        min: 0, max: 255, get: () => lighting?.hue ?? 0,        set: (v: number) => { syncLightValue(0x04, v, lighting?.saturation ?? 0, () => setLightingHue(v), 'hue'); } },
    { key: 'saturation', label: 'Saturation', min: 0, max: 255, get: () => lighting?.saturation ?? 0, set: (v: number) => { syncLightValue(0x04, lighting?.hue ?? 0, v, () => setLightingSaturation(v), 'saturation'); } },
  ];
</script>

<div class="flex flex-col h-full p-4 overflow-y-auto">
  <div class="bg-surface-dark border border-surface-raised rounded-xl p-6 space-y-5 max-w-xl w-full mx-auto">
    {#if getLighting() === null}
      <div class="p-8 text-center text-text-dimmed text-sm italic">
        <p>Configuration is not supported or not loaded for this device</p>
      </div>
    {:else}
      {#each sliders as s}
      <div class="space-y-1.5">
        <div class="flex justify-between items-baseline">
          <label for="slider-{s.key}" class="text-sm font-medium text-text-muted">{s.label}</label>
          <span class="text-xs text-text-dimmed tabular-nums">{s.get()}</span>
        </div>
        <input
          id="slider-{s.key}"
          type="range"
          min={s.min}
          max={s.max}
          value={s.get()}
          oninput={(e) => s.set(Number(e.currentTarget.value))}
          class="w-full h-2 rounded-full appearance-none cursor-pointer bg-surface-raised
                 accent-accent-cyan
                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-cyan [&::-webkit-slider-thumb]:shadow-md"
        />
      </div>
    {/each}
    {/if}
  </div>
</div>
