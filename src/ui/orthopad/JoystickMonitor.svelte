<script lang="ts">
  import type { OrthoPadJoystickState } from '../../device/orthopad';
  import JoystickCalibration from './JoystickCalibration.svelte';
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
  const POLL_INTERVAL_MS = 20;
  const DISPLAY_EASING = 0.3;
  const connectionState = $derived(getOrthoPadConnectionState());
  const backend = $derived(getOrthoPadBackend());
  const config = $derived(getOrthoPadConfig());
  const sample = $derived(getOrthoPadJoystickState());
  const encoderSteps = $derived(sample?.encoderSteps ?? 0);
  const encoderTelemetryAvailable = $derived(sample?.encoderSteps !== null && sample?.encoderSteps !== undefined);
  const rawY = $derived(sample?.rawY ?? 512);
  const rawX = $derived(sample?.rawX ?? 512);
  const centerX = $derived(config?.settings.centerX ?? 512);
  const centerY = $derived(config?.settings.centerY ?? 512);
  const deadzone = $derived(config?.settings.deadzone ?? 30);
  const invertX = $derived(config?.settings.invertX ?? false);
  const invertY = $derived(config?.settings.invertY ?? false);
  const effectiveX = $derived(invertX ? centerX - (rawX - centerX) : rawX);
  const effectiveY = $derived(invertY ? centerY - (rawY - centerY) : rawY);
  let visualX = $state(512);
  let visualY = $state(512);
  let animationX = 512;
  let animationY = 512;
  const pointX = $derived(axisPosition(visualX, centerX));
  const pointY = $derived(CENTER - ((visualY - centerY) / 512) * RADIUS);
  const deadzoneRadius = $derived(Math.max(5, Math.min(RADIUS, (deadzone / 512) * RADIUS)));
  const offset = $derived(Math.hypot(rawX - centerX, rawY - centerY));
  const centered = $derived(offset <= deadzone);

  let encoderEvent = $state('No movement yet');
  let lastEncoderSteps: number | null = null;
  let monitorError = $state('');
  let sampleSequence = $state(0);
  $effect(() => {
    const currentState = connectionState;
    const currentBackend = backend;
    if (currentState !== 'connected' || !currentBackend) return;
    let stopped = false;

    const poll = async () => {
      let testModeActive = false;
      try {
        await currentBackend.setTestMode(true);
        testModeActive = true;
      } catch {
        // Legacy firmware has no test-mode command; retain telemetry compatibility.
      }
      if (stopped) {
        if (testModeActive) await currentBackend.setTestMode(false).catch(() => {});
        return;
      }
      while (!stopped) {
        try {
          const next = await currentBackend.getJoystickState();
          if (!stopped) {
            setOrthoPadJoystickState(next);
            sampleSequence += 1;
          }
        } catch (reason) {
          if (!stopped) monitorError = reason instanceof Error ? reason.message : 'Joystick telemetry failed';
        }
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      }
      if (testModeActive) await currentBackend.setTestMode(false).catch(() => {});
    };
    void poll();
    return () => { stopped = true; };
  });

  $effect(() => {
    if (!encoderTelemetryAvailable) {
      lastEncoderSteps = null;
      return;
    }
    const current = encoderSteps;
    if (lastEncoderSteps === null) {
      lastEncoderSteps = current;
      return;
    }
    const delta = counterDelta(current, lastEncoderSteps);
    if (delta > 0) encoderEvent = `Clockwise +${delta}`;
    if (delta < 0) encoderEvent = `Counter-clockwise ${delta}`;
    lastEncoderSteps = current;
  });
  $effect(() => {
    const targetX = effectiveX;
    const targetY = effectiveY;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let currentX = animationX;
    let currentY = animationY;
    const animate = () => {
      if (stopped) return;
      currentX += (targetX - currentX) * DISPLAY_EASING;
      currentY += (targetY - currentY) * DISPLAY_EASING;
      animationX = currentX;
      animationY = currentY;
      visualX = currentX;
      visualY = currentY;
      if (Math.abs(targetX - currentX) < 0.25 && Math.abs(targetY - currentY) < 0.25) {
        visualX = targetX;
        visualY = targetY;
        return;
      }
      timer = setTimeout(animate, 16);
    };
    timer = setTimeout(animate, 0);
    return () => {
      stopped = true;
      if (timer !== undefined) clearTimeout(timer);
    };
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
  function counterDelta(current: number, previous: number): number {
    let delta = current - previous;
    if (delta > 0x7fffffff) delta -= 0x100000000;
    if (delta < -0x7fffffff) delta += 0x100000000;
    return delta;
  }
</script>

<section aria-labelledby="joystick-monitor-title" class="rounded-xl border border-surface-raised bg-surface-dark p-4 space-y-4">
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <div class="flex items-center gap-2">
        <span class="inline-block h-2 w-2 rounded-full {connectionState === 'connected' && sample ? 'bg-accent-lime animate-pulse' : 'bg-text-dimmed'}"></span>
        <h2 id="joystick-monitor-title" class="font-semibold text-text-primary">Joystick monitor</h2>
      </div>
      <p class="mt-1 text-xs text-text-muted">Dot mengikuti output efektif; kartu X/Y tetap raw ADC untuk diagnosis.</p>
      <p class="mt-1 text-[0.65rem] text-text-dimmed">X {invertX ? 'inverted' : 'normal'} · Y {invertY ? 'inverted' : 'normal'}</p>
    </div>
    <div class="text-right text-xs text-text-muted">
      <div>{connectionState === 'connected' ? '50 samples/sec · smoothed' : 'Not connected'}</div>
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
        <div class="rounded-lg border border-surface-raised p-3">
          <div class="flex items-center justify-between text-xs">
            <span class="text-text-dimmed">Encoder tester</span>
            <span class="font-mono text-text-primary">{encoderTelemetryAvailable ? `${encoderSteps} steps` : 'Update firmware'}</span>
          </div>
          <div class="mt-2 grid grid-cols-2 gap-2">
            <div class="rounded-md bg-bg-dark px-3 py-2">
              <div class="text-[0.65rem] text-text-dimmed">Last rotation</div>
              <div class="mt-1 text-sm text-accent-cyan">{encoderTelemetryAvailable ? encoderEvent : 'Firmware 0.3.0 required'}</div>
            </div>
            <div class="rounded-md bg-bg-dark px-3 py-2">
              <div class="text-[0.65rem] text-text-dimmed">Encoder switch</div>
              <div class="mt-1 flex items-center gap-2 text-sm text-text-primary">
                <span class="h-2 w-2 rounded-full {pressed(6) ? 'bg-accent-lime' : 'bg-text-dimmed'}"></span>
                {pressed(6) ? 'Pressed' : 'Released'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if monitorError}
    <p class="text-xs text-accent-amber">Telemetry: {monitorError}</p>
  {/if}
</section>

<JoystickCalibration
  connected={connectionState === 'connected'}
  sample={sample}
  sampleSequence={sampleSequence}
/>
