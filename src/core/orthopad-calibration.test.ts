import { describe, expect, it } from 'vitest';
import { estimateJoystickCalibration } from './orthopad-calibration';

describe('joystick calibration', () => {
  it('uses the idle median and minimum safe deadzone', () => {
    const estimate = estimateJoystickCalibration(
      [
        { rawX: 510, rawY: 500 },
        { rawX: 512, rawY: 502 },
        { rawX: 514, rawY: 504 },
        { rawX: 512, rawY: 502 },
      ],
      [
        { rawX: 100, rawY: 120 },
        { rawX: 900, rawY: 880 },
      ],
    );

    expect(estimate.centerX).toBe(512);
    expect(estimate.centerY).toBe(502);
    expect(estimate.deadzone).toBe(30);
    expect(estimate.usable).toBe(true);
  });

  it('raises deadzone when idle noise is high and reports axis ranges', () => {
    const estimate = estimateJoystickCalibration(
      Array.from({ length: 20 }, (_, index) => ({ rawX: index % 2 === 0 ? 480 : 544, rawY: 512 })),
      [
        { rawX: 300, rawY: 350 },
        { rawX: 700, rawY: 650 },
      ],
    );

    expect(estimate.noiseX).toBe(32);
    expect(estimate.deadzone).toBe(48);
    expect(estimate.minX).toBe(300);
    expect(estimate.maxY).toBe(650);
  });

  it('rejects incomplete calibration phases', () => {
    expect(() => estimateJoystickCalibration([], [{ rawX: 1, rawY: 1 }])).toThrow('idle and motion samples');
    expect(() => estimateJoystickCalibration([{ rawX: 512, rawY: 512 }], [])).toThrow('idle and motion samples');
  });
});
