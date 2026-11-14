<script lang="ts">
  import type { OrthoPadJoystickState } from '../../device/orthopad';
  import { estimateJoystickCalibration, type JoystickCalibrationEstimate, type JoystickCalibrationSample } from '../../core/orthopad-calibration';
  import {
    getOrthoPadConfig,
    setOrthoPadSettings,
  } from '../../store/orthopad.svelte';

  const IDLE_SAMPLE_COUNT = 100;
  const MOTION_SAMPLE_COUNT = 200;

  type CalibrationPhase = 'idle' | 'center' | 'motion' | 'review';

  let {
    connected,
    sample,
    sampleSequence,
  }: {
    connected: boolean;
    sample: OrthoPadJoystickState | null;
    sampleSequence: number;
  } = $props();

  const config = $derived(getOrthoPadConfig());
  let phase = $state<CalibrationPhase>('idle');
  let idleSamples = $state<JoystickCalibrationSample[]>([]);
  let motionSamples = $state<JoystickCalibrationSample[]>([]);
  let estimate = $state<JoystickCalibrationEstimate | null>(null);
  let error = $state('');
  let applied = $state(false);
  let invertX = $state(false);
  let invertY = $state(false);
  let lastSequence = 0;

  $effect(() => {
    const sequence = sampleSequence;
    const currentSample = sample;
    const currentPhase = phase;
    if (!currentSample || sequence === lastSequence || (currentPhase !== 'center' && currentPhase !== 'motion')) return;
    lastSequence = sequence;
    const nextSample = { rawX: currentSample.rawX, rawY: currentSample.rawY };
    if (currentPhase === 'center') {
      idleSamples = [...idleSamples, nextSample];
      if (idleSamples.length >= IDLE_SAMPLE_COUNT) phase = 'motion';
      return;
    }
    motionSamples = [...motionSamples, nextSample];
    if (motionSamples.length < MOTION_SAMPLE_COUNT) return;
    try {
      estimate = estimateJoystickCalibration(idleSamples, motionSamples);
      phase = 'review';
    } catch (reason) {
      error = reason instanceof Error ? reason.message : 'Calibration failed';
      phase = 'idle';
    }
  });

  $effect(() => {
    if (!connected && phase !== 'idle') cancel();
  });

  function start(): void {
    const settings = config?.settings;
    phase = 'center';
    idleSamples = [];
    motionSamples = [];
    estimate = null;
    error = '';
    applied = false;
    invertX = settings?.invertX ?? false;
    invertY = settings?.invertY ?? false;
    lastSequence = sampleSequence;
  }

  function cancel(): void {
    phase = 'idle';
    idleSamples = [];
    motionSamples = [];
    estimate = null;
    error = '';
  }

  function apply(): void {
    if (!estimate?.usable) return;
    setOrthoPadSettings({
      centerX: estimate.centerX,
      centerY: estimate.centerY,
      deadzone: estimate.deadzone,
      invertX,
      invertY,
    });
    applied = true;
    phase = 'idle';
  }

  function progress(): number {
    if (phase === 'center') return Math.round((idleSamples.length / IDLE_SAMPLE_COUNT) * 100);
    if (phase === 'motion') return Math.round((motionSamples.length / MOTION_SAMPLE_COUNT) * 100);
    return 100;
  }

  function rangeLabel(min: number, max: number): string {
    return `${min}–${max} (${max - min})`;
  }
</script>

{#if connected}
  <section aria-labelledby="joystick-calibration-title" class="rounded-xl border border-accent-cyan/30 bg-surface-dark p-4 space-y-3">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 id="joystick-calibration-title" class="font-semibold text-text-primary">Joystick calibration</h3>
        <p class="mt-1 max-w-2xl text-xs text-text-muted">Membaca raw ADC tanpa menggerakkan mouse. Hasil masuk ke draft; simpan lewat Apply &amp; Save.</p>
      </div>
      {#if phase === 'idle'}
        <button class="rounded-lg border border-accent-cyan/50 px-3 py-2 text-xs text-accent-cyan hover:bg-accent-cyan/10" onclick={start}>Start calibration</button>
      {:else}
        <button class="rounded-lg border border-surface-raised px-3 py-2 text-xs text-text-muted hover:text-text-primary" onclick={cancel}>Cancel</button>
      {/if}
    </div>

    {#if error}
      <p class="rounded-md border border-accent-red/40 bg-accent-red/10 px-3 py-2 text-xs text-accent-red">{error}</p>
    {/if}
    {#if applied}
      <p class="rounded-md border border-accent-lime/30 bg-accent-lime/10 px-3 py-2 text-xs text-accent-lime">Calibration masuk ke draft. Klik Apply &amp; Save untuk menulis device.</p>
    {/if}

    {#if phase === 'center' || phase === 'motion'}
      <div class="rounded-lg border border-surface-raised bg-bg-dark p-3" aria-live="polite">
        <div class="flex items-center justify-between gap-3 text-sm text-text-primary">
          <strong>{phase === 'center' ? 'Center capture' : 'Range capture'}</strong>
          <span class="font-mono text-accent-cyan">{progress()}%</span>
        </div>
        <p class="mt-1 text-xs text-text-muted">
          {phase === 'center' ? 'Lepaskan joystick dan biarkan tetap di tengah.' : 'Gerakkan joystick perlahan melewati kiri, kanan, atas, dan bawah.'}
        </p>
        <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-raised">
          <div class="h-full rounded-full bg-accent-cyan transition-[width] duration-150" style={`width: ${progress()}%`}></div>
        </div>
        <p class="mt-2 text-[0.65rem] text-text-dimmed">{phase === 'center' ? `${idleSamples.length}/${IDLE_SAMPLE_COUNT} samples` : `${motionSamples.length}/${MOTION_SAMPLE_COUNT} samples`}</p>
      </div>
    {:else if phase === 'review' && estimate}
      <div class="space-y-3" aria-live="polite">
        <div class="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div class="rounded-md bg-bg-dark px-3 py-2"><span class="text-text-dimmed">Center X</span><br /><strong>{estimate.centerX}</strong></div>
          <div class="rounded-md bg-bg-dark px-3 py-2"><span class="text-text-dimmed">Center Y</span><br /><strong>{estimate.centerY}</strong></div>
          <div class="rounded-md bg-bg-dark px-3 py-2"><span class="text-text-dimmed">Noise</span><br /><strong>{estimate.noiseX}/{estimate.noiseY}</strong></div>
          <div class="rounded-md bg-bg-dark px-3 py-2"><span class="text-text-dimmed">Deadzone</span><br /><strong>{estimate.deadzone}</strong></div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="rounded-md bg-bg-dark px-3 py-2"><span class="text-text-dimmed">X range</span><br /><strong>{rangeLabel(estimate.minX, estimate.maxX)}</strong></div>
          <div class="rounded-md bg-bg-dark px-3 py-2"><span class="text-text-dimmed">Y range</span><br /><strong>{rangeLabel(estimate.minY, estimate.maxY)}</strong></div>
        </div>
        {#if !estimate.usable}
          <p class="rounded-md border border-accent-amber/40 bg-accent-amber/10 px-3 py-2 text-xs text-accent-amber">Range terlalu sempit. Periksa kabel, VCC/GND, atau gerakkan joystick sampai ujung sebelum menerapkan.</p>
        {/if}
        <div class="flex flex-wrap gap-4 text-xs text-text-muted">
          <label class="inline-flex items-center gap-2"><input type="checkbox" bind:checked={invertX} />Invert X</label>
          <label class="inline-flex items-center gap-2"><input type="checkbox" bind:checked={invertY} />Invert Y</label>
        </div>
        <div class="flex flex-wrap justify-end gap-2">
          <button class="rounded-lg border border-surface-raised px-3 py-2 text-xs text-text-muted hover:text-text-primary" onclick={start}>Retake</button>
          <button class="rounded-lg bg-accent-cyan px-3 py-2 text-xs font-semibold text-bg-dark disabled:cursor-not-allowed disabled:opacity-40" disabled={!estimate.usable} onclick={apply}>Use calibration</button>
        </div>
      </div>
    {/if}
  </section>
{/if}
