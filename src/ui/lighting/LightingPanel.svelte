<script lang="ts">
  import { getLighting, setLightingBrightness, setLightingEffect, setLightingSpeed, setLightingHue, setLightingSaturation } from '../../store/app.svelte';

  const lighting = $derived(getLighting());

  const sliders = [
    { key: 'brightness', label: 'Brightness', min: 0, max: 255, get: () => lighting.brightness, set: (v: number) => setLightingBrightness(v), accent: 'blue' },
    { key: 'effect',     label: 'Effect',     min: 0, max: 20,  get: () => lighting.effect,     set: (v: number) => setLightingEffect(v),     accent: 'blue' },
    { key: 'speed',      label: 'Speed',      min: 0, max: 255, get: () => lighting.speed,      set: (v: number) => setLightingSpeed(v),      accent: 'blue' },
    { key: 'hue',        label: 'Hue',        min: 0, max: 255, get: () => lighting.hue,        set: (v: number) => setLightingHue(v),        accent: 'pink' },
    { key: 'saturation', label: 'Saturation', min: 0, max: 255, get: () => lighting.saturation, set: (v: number) => setLightingSaturation(v), accent: 'pink' },
  ];

  const accentTrack: Record<string, string> = {
    blue: '[&::-webkit-slider-runnable-track]:bg-blue-600 [&::-moz-range-track]:bg-blue-600',
    pink: '[&::-webkit-slider-runnable-track]:bg-pink-600 [&::-moz-range-track]:bg-pink-600',
  };
</script>

<div class="max-w-xl mx-auto p-4">
  <div class="bg-gray-900 rounded-lg border border-gray-700 p-6 space-y-5">
    {#each sliders as s}
      <div class="space-y-1.5">
        <div class="flex justify-between items-baseline">
          <label for="slider-{s.key}" class="text-sm font-medium text-gray-300">{s.label}</label>
          <span class="text-xs text-gray-500 tabular-nums">{s.get()}</span>
        </div>
        <input
          id="slider-{s.key}"
          type="range"
          min={s.min}
          max={s.max}
          value={s.get()}
          oninput={(e) => s.set(Number(e.currentTarget.value))}
          class="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-700
                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg
                 {accentTrack[s.accent]}"
        />
      </div>
    {/each}
  </div>
</div>
