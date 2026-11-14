<script lang="ts">
  import type { OrthoPadJoystickState } from '../../device/orthopad';
  import {
    getOrthoPadBackend,
    getOrthoPadConfig,
    getOrthoPadConnectionState,
    getOrthoPadJoystickState,
    setOrthoPadJoystickState,
  } from '../../store/orthopad.svelte';

  const CENTER = 120;
  const RADIUS = 96;
  const BUTTON_LABELS = ['BTN1', 'BTN2', 'BTN3', 'BTN4', 'BTN5'];

  const connectionState = $derived(getOrthoPadConnectionState());
  const backend = $derived(getOrthoPadBackend());
  const config = $derived(getOrthoPadConfig());
  const sample = $derived(getOrthoPadJoystickState());
  const rawX = $derived(sample?.rawX ?? 512);
  const rawY = $derived(sample?.rawY ?? 512);
  const centerX = $derived(config?.settings.centerX ?? 512);
  const centerY = $derived(config?.settings.centerY ?? 512);
  const deadzone = $derived(config?.settings.deadzone ?? 100);
  const pointX = $derived(axisPosition(rawX, centerX));
  const pointY = $derived(CENTER - ((rawY - centerY) / 512) * RADIUS);
  const deadzoneRadius = $derived(Math.max(5, Math.min(RADIUS, (deadzone / 512) * RADIUS)));
  const offset = $derived(Math.hypot(rawX - centerX, rawY - centerY));
  const centered = $derived(offset <= deadzone);

  let monitorError = $state('');

  $effect(() => {
    const currentState = connectionState;
    const currentBackend = backend;
    if (currentState !== 'connected' || !currentBackend) return;

    let stopped = false;
    const poll = async () => {
      while (!stopped) {
        try {
          const next = await currentBackend.getJoystickState();
          if (!stopped) {
            setOrthoPadJoystickState(next);
            monitorError = '';
          }
        } catch (reason) {
          if (!stopped) monitorError = reason instanceof Error ? reason.message : 'Joystick telemetry failed';
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };

    void poll();
    return () => { stopped = true; };
  });

  function axisPosition(value: number, center: number): number {
    return Math.max(CENTER - RADIUS, Math.min(CENTER + RADIUS, CENTER + ((value - center) / 512) * RADIUS));
  }

  function normalized(value: number, center: number): string {
    return ((value - center) / 512).toFixed(2);
  }

  function pressed(bit: number): boolean {
    return sample !== null && (sample.buttonMask & (1 << bit)) !== 0;
  }

  function modeLabel(value: OrthoPadJoystickState | null): string {
    if (!value) return 'Waiting for sample';
    if ((value.modeFlags & 0x04) !== 0) return 'Pan active';
    if ((value.modeFlags & 0x02) !== 0) return 'Orbit active';
    if ((value.modeFlags & 0x01) !== 0) return 'Joystick held';
    return 'Idle';
  }

  function layerLabel(value: number): string {
    return ['Core', 'Sketch', 'Modify'][value] ?? `Layer ${value + 1}`;
  }
</script>

<section aria-labelledby="joystick-monitor-title" class="rounded-xl border border-surface-raised bg-surface-dark p-4 space-y-4">
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <div class="flex items-center gap-2">
        <span class="inline-block h-2 w-2 rounded-full {connectionState === 'connected' && sample ? 'bg-accent-lime animate-pulse' : 'bg-text-dimmed'}"></span>
        <h2 id="joystick-monitor-title" class="font-semibold text-text-primary">Joystick monitor</h2>
      </div>
      <p class="mt-1 text-xs text-text-muted">Live raw ADC telemetry untuk memeriksa center, deadzone, drift, dan switch.</p>
    </div>
    <div class="text-right text-xs text-text-muted">
      <div>{connectionState === 'connected' ? '10 samples/sec' : 'Not connected'}</div>
      {#if sample}<div>Layer: <span class="text-text-primary">{layerLabel(sample.activeLayer)}</span></div>{/if}
    </div>
  </div>

  {#if connectionState !== 'connected'}
    <div class="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-surface-raised px-4 text-center text-sm text-text-muted">
      Connect OrthoPad untuk memulai monitor joystick.
    </div>
  {:else}
    <div class="grid gap-4 lg:grid-cols-[minmax(220px,300px)_1fr] lg:items-center">
      <div class="rounded-lg border border-surface-raised bg-bg-dark p-3">
        <svg viewBox="0 0 240 240" class="mx-auto w-full max-w-[280px]" role="img" aria-label="Live joystick position">
          <circle cx="120" cy="120" r="102" fill="none" stroke="currentColor" class="text-surface-raised" stroke-width="2" />
          <circle cx="120" cy="120" r="96" fill="none" stroke="currentColor" class="text-accent-cyan/40" stroke-width="1" />
          <circle cx="120" cy="120" r={deadzoneRadius} fill="none" stroke="currentColor" class="text-accent-amber/60" stroke-width="1" stroke-dasharray="3 3" />
          <line x1="24" y1="120" x2="216" y2="120" stroke="currentColor" class="text-surface-raised" stroke-width="1" />
          <line x1="120" y1="24" x2="120" y2="216" stroke="currentColor" class="text-surface-raised" stroke-width="1" />
          <circle cx={CENTER} cy={CENTER} r="4" fill="currentColor" class="text-text-dimmed" />
          <circle cx={pointX} cy={pointY} r="11" fill="currentColor" class={centered ? 'text-accent-lime' : 'text-accent-cyan'} stroke="currentColor" stroke-width="3" stroke-opacity="0.25" />
        </svg>
        <div class="mt-2 flex items-center justify-between text-[0.65rem] text-text-dimmed">
          <span>X− {rawX}</span>
          <span class={centered ? 'text-accent-lime' : 'text-accent-amber'}>{centered ? 'In deadzone' : 'Outside deadzone'}</span>
          <span>{rawY} Y+ </span>
        </div>
      </div>

      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-2">
          <div class="rounded-lg border border-surface-raised p-3">
            <div class="text-[0.65rem] text-text-dimmed">X raw / offset</div>
            <div class="mt-1 font-mono text-lg text-text-primary">{rawX} <span class="text-sm text-text-muted">({normalized(rawX, centerX)})</span></div>
            <div class="mt-1 text-[0.65rem] text-text-muted">center {centerX}</div>
          </div>
          <div class="rounded-lg border border-surface-raised p-3">
            <div class="text-[0.65rem] text-text-dimmed">Y raw / offset</div>
            <div class="mt-1 font-mono text-lg text-text-primary">{rawY} <span class="text-sm text-text-muted">({normalized(rawY, centerY)})</span></div>
            <div class="mt-1 text-[0.65rem] text-text-muted">center {centerY}</div>
          </div>
        </div>

        <div class="rounded-lg border border-surface-raised p-3">
          <div class="flex items-center justify-between text-xs">
            <span class="text-text-dimmed">Gesture mode</span>
            <span class="text-text-primary">{modeLabel(sample)}</span>
          </div>
          <div class="mt-1 flex items-center justify-between text-xs">
            <span class="text-text-dimmed">Distance from center</span>
            <span class="font-mono text-text-primary">{offset.toFixed(0)} / deadzone {deadzone}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {#each BUTTON_LABELS as label, index}
            <div class="flex items-center gap-2 rounded-lg border border-surface-raised px-2 py-2 text-xs">
              <span class="h-2 w-2 rounded-full {pressed(index) ? 'bg-accent-lime' : 'bg-text-dimmed'}"></span>
              <span class="text-text-muted">{label}</span>
            </div>
          {/each}
          <div class="flex items-center gap-2 rounded-lg border border-surface-raised px-2 py-2 text-xs">
            <span class="h-2 w-2 rounded-full {pressed(5) ? 'bg-accent-lime' : 'bg-text-dimmed'}"></span>
            <span class="text-text-muted">JOY SW</span>
          </div>
          <div class="flex items-center gap-2 rounded-lg border border-surface-raised px-2 py-2 text-xs">
            <span class="h-2 w-2 rounded-full {pressed(6) ? 'bg-accent-lime' : 'bg-text-dimmed'}"></span>
            <span class="text-text-muted">ENC SW</span>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if monitorError}
    <p class="text-xs text-accent-amber">Telemetry: {monitorError}</p>
  {/if}
</section>
