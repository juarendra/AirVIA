<script lang="ts">
  import { getLighting, setLightingBrightness, setLightingEffect, setLightingSpeed, setLightingHue, setLightingSaturation, markDirty } from '../../store/app.svelte';
  import { Protocol } from '../../core/protocol';
  import { sendViaCommand } from '../../ble/dispatch';

  const timers: Record<string, ReturnType<typeof setTimeout>> = {};

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
    }, 150); // 150ms debounce
  }

  const lighting = $derived(getLighting());

  const sliders = [
    { key: 'brightness', label: 'Brightness', min: 0, max: 255, get: () => lighting?.brightness ?? 0, set: (v: number) => { syncLightValue(0x01, v, 0, () => setLightingBrightness(v), 'brightness'); }, accent: 'blue' },
    { key: 'effect',     label: 'Effect',     min: 0, max: 20,  get: () => lighting?.effect ?? 0,     set: (v: number) => { syncLightValue(0x02, v, 0, () => setLightingEffect(v), 'effect'); },     accent: 'blue' },
    { key: 'speed',      label: 'Speed',      min: 0, max: 255, get: () => lighting?.speed ?? 0,      set: (v: number) => { syncLightValue(0x03, v, 0, () => setLightingSpeed(v), 'speed'); },      accent: 'blue' },
    { key: 'hue',        label: 'Hue',        min: 0, max: 255, get: () => lighting?.hue ?? 0,        set: (v: number) => { syncLightValue(0x04, v, lighting?.saturation ?? 0, () => setLightingHue(v), 'hue'); },        accent: 'pink' },
    { key: 'saturation', label: 'Saturation', min: 0, max: 255, get: () => lighting?.saturation ?? 0, set: (v: number) => { syncLightValue(0x04, lighting?.hue ?? 0, v, () => setLightingSaturation(v), 'saturation'); }, accent: 'pink' },
  ];

  const accentTrack: Record<string, string> = {
    blue: '[&::-webkit-slider-runnable-track]:bg-blue-600 [&::-moz-range-track]:bg-blue-600',
    pink: '[&::-webkit-slider-runnable-track]:bg-pink-600 [&::-moz-range-track]:bg-pink-600',
  };
</script>

<div class="max-w-xl mx-auto p-4">
  <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
    {#if getLighting() === null}
      <div class="p-8 text-center text-slate-400 text-sm italic">
        <p>Configuration is not supported or not loaded for this device</p>
      </div>
    {:else}
      {#each sliders as s}
      <div class="space-y-1.5">
        <div class="flex justify-between items-baseline">
          <label for="slider-{s.key}" class="text-sm font-medium text-slate-600">{s.label}</label>
          <span class="text-xs text-slate-400 tabular-nums">{s.get()}</span>
        </div>
        <input
          id="slider-{s.key}"
          type="range"
          min={s.min}
          max={s.max}
          value={s.get()}
          oninput={(e) => s.set(Number(e.currentTarget.value))}
          class="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200
                 accent-blue-500
                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-md"
        />
      </div>
    {/each}
    {/if}
  </div>
</div>
