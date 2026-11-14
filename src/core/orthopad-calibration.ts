export type JoystickCalibrationSample = {
  rawX: number;
  rawY: number;
};

export type JoystickCalibrationEstimate = {
  centerX: number;
  centerY: number;
  deadzone: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  noiseX: number;
  noiseY: number;
  usable: boolean;
};

const MIN_DEADZONE = 30;
const MAX_DEADZONE = 200;
const MIN_AXIS_RANGE = 300;

function median(values: number[]): number {
  if (values.length === 0) throw new Error('Calibration needs samples');
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle]!;
}

function percentile(values: number[], fraction: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil((sorted.length - 1) * fraction));
  return sorted[index]!;
}

function range(values: number[]): { min: number; max: number } {
  if (values.length === 0) throw new Error('Calibration needs motion samples');
  return { min: Math.min(...values), max: Math.max(...values) };
}

export function estimateJoystickCalibration(
  idleSamples: JoystickCalibrationSample[],
  motionSamples: JoystickCalibrationSample[],
): JoystickCalibrationEstimate {
  if (idleSamples.length === 0 || motionSamples.length === 0) throw new Error('Calibration needs idle and motion samples');

  const idleX = idleSamples.map(sample => sample.rawX);
  const idleY = idleSamples.map(sample => sample.rawY);
  const centerX = Math.round(median(idleX));
  const centerY = Math.round(median(idleY));
  const noiseX = percentile(idleX.map(value => Math.abs(value - centerX)), 0.95);
  const noiseY = percentile(idleY.map(value => Math.abs(value - centerY)), 0.95);
  const deadzone = Math.min(MAX_DEADZONE, Math.max(MIN_DEADZONE, Math.ceil(Math.max(noiseX, noiseY) * 1.5)));
  const x = range(motionSamples.map(sample => sample.rawX));
  const y = range(motionSamples.map(sample => sample.rawY));

  return {
    centerX,
    centerY,
    deadzone,
    minX: x.min,
    maxX: x.max,
    minY: y.min,
    maxY: y.max,
    noiseX,
    noiseY,
    usable: x.max - x.min >= MIN_AXIS_RANGE && y.max - y.min >= MIN_AXIS_RANGE,
  };
}
