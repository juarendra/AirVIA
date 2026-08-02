<script lang="ts">
  import { getLighting, setLightingBrightness, setLightingEffect, setLightingSpeed, setLightingHue, setLightingSaturation, markDirty } from '../../store/app.svelte';
  import { Protocol } from '../../core/protocol';
  import { sendPacket } from '../../ble/dispatch';

  const lighting = $derived(getLighting());

  const sliders = [
    { key: 'brightness', label: 'Brightness', min: 0, max: 255, get: () => lighting.brightness, set: (v: number) => { setLightingBrightness(v); markDirty(); sendPacket(Protocol.setCustomValue(0x01, v, 0)).catch(() => {}); }, accent: 'blue' },
    { key: 'effect',     label: 'Effect',     min: 0, max: 20,  get: () => lighting.effect,     set: (v: number) => { setLightingEffect(v); markDirty(); sendPacket(Protocol.setCustomValue(0x02, v, 0)).catch(() => {}); },     accent: 'blue' },
    { key: 'speed',      label: 'Speed',      min: 0, max: 255, get: () => lighting.speed,      set: (v: number) => { setLightingSpeed(v); markDirty(); sendPacket(Protocol.setCustomValue(0x03, v, 0)).catch(() => {}); },      accent: 'blue' },
    { key: 'hue',        label: 'Hue',        min: 0, max: 255, get: () => lighting.hue,        set: (v: number) => { setLightingHue(v); markDirty(); sendPacket(Protocol.setCustomValue(0x04, v, lighting.saturation)).catch(() => {}); },        accent: 'pink' },
    { key: 'saturation', label: 'Saturation', min: 0, max: 255, get: () => lighting.saturation, set: (v: number) => { setLightingSaturation(v); markDirty(); sendPacket(Protocol.setCustomValue(0x04, lighting.hue, v)).catch(() => {}); }, accent: 'pink' },
  ];

  const accentTrack: Record<string, string> = {
    blue: '[&::-webkit-slider-runnable-track]:bg-blue-600 [&::-moz-range-track]:bg-blue-600',
    pink: '[&::-webkit-slider-runnable-track]:bg-pink-600 [&::-moz-range-track]:bg-pink-600',
  };
</script>

<div class="max-w-xl mx-auto p-4">
  <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
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
  </div>
</div>
