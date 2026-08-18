/**
 * Feature extraction pipeline.
 * Mirrors backend app/features/ exactly:
 *   - FrameFeatureExtractor
 *   - TimingFeatureExtractor
 *   - SignalFeatureExtractor
 *   - CrossSignalFeatureExtractor
 *   - StateTracker
 */

import type { RawCanFrame } from './ascParser';
import type { DecodedCanMessage } from './dbcParser';

// ---- State Tracker ----
export class StateTracker {
  private lastTimestamps = new Map<number, number>();
  private expectedCycles = new Map<number, number>();
  private seenCounts = new Map<number, number>();
  private signals = new Map<string, number | string>();

  getLastTimestamp(canId: number): number | null {
    return this.lastTimestamps.get(canId) ?? null;
  }

  updateTimestamp(canId: number, ts: number): void {
    const last = this.lastTimestamps.get(canId);
    if (last !== undefined) {
      const count = (this.seenCounts.get(canId) ?? 0) + 1;
      this.seenCounts.set(canId, count);
      // Rolling average of cycle time
      const oldCycle = this.expectedCycles.get(canId) ?? (ts - last);
      const newCycle = oldCycle + (ts - last - oldCycle) / count;
      this.expectedCycles.set(canId, newCycle);
    }
    this.lastTimestamps.set(canId, ts);
  }

  getExpectedCycle(canId: number): number {
    return this.expectedCycles.get(canId) ?? 0;
  }

  get lastSeenTimestamps(): Map<number, number> {
    return this.lastTimestamps;
  }

  getSignal(name: string): number | string | null {
    return this.signals.get(name) ?? null;
  }

  updateSignals(decoded: DecodedCanMessage): void {
    for (const [name, sv] of decoded.signals) {
      this.signals.set(name, typeof sv.physicalValue === 'string' ? sv.physicalValue : sv.rawValue);
    }
  }
}

// ---- Frame Feature Extractor ----
function calculateEntropy(data: Uint8Array): number {
  if (data.length === 0) return 0.0;
  const counts = new Array(256).fill(0);
  for (const b of data) counts[b]++;
  let entropy = 0;
  for (const c of counts) {
    if (c > 0) {
      const p = c / data.length;
      entropy -= p * Math.log2(p);
    }
  }
  return entropy;
}

function extractFrameFeatures(
  frame: RawCanFrame,
  decoded: DecodedCanMessage | null
): Record<string, number> {
  const d = frame.data;
  const allZero = d.length > 0 && d.every(b => b === 0x00) ? 1 : 0;
  const allFf = d.length > 0 && d.every(b => b === 0xff) ? 1 : 0;
  const aa55 = d.length > 0 && d.every(b => b === 0xaa || b === 0x55) ? 1 : 0;
  const dlcMatch = decoded !== null ? 1 : 0;
  return {
    dlc_match: dlcMatch,
    payload_entropy: calculateEntropy(d),
    all_zero: allZero,
    all_ff: allFf,
    aa_55_pattern: aa55,
  };
}

// ---- Timing Feature Extractor ----
function extractTimingFeatures(
  frame: RawCanFrame,
  state: StateTracker
): Record<string, number> {
  const features: Record<string, number> = {
    delta_time: 0.0,
    timing_deviation: 0.0,
    burst_rate: 0.0,
  };

  const lastTs = state.getLastTimestamp(frame.arbitrationId);
  if (lastTs !== null) {
    const delta = frame.timestamp - lastTs;
    features.delta_time = delta;
    const expected = state.getExpectedCycle(frame.arbitrationId);
    if (expected > 0) {
      features.timing_deviation = Math.abs(delta - expected);
    }
    if (delta > 0) {
      features.burst_rate = 1.0 / delta;
    } else {
      features.burst_rate = 1e6; // inf cap
    }
  }

  state.updateTimestamp(frame.arbitrationId, frame.timestamp);
  return features;
}

// ---- Signal Feature Extractor ----
function extractSignalFeatures(
  frame: RawCanFrame,
  decoded: DecodedCanMessage | null,
  state: StateTracker
): Record<string, number> {
  const features: Record<string, number> = {};
  if (!decoded) return features;

  for (const [sigName, sv] of decoded.signals) {
    const val = sv.rawValue;
    features[`${sigName}_raw`] = val;

    let dist = 0.0;
    if (sv.validRange) {
      const [minV, maxV] = sv.validRange;
      if (val < minV) dist = minV - val;
      else if (val > maxV) dist = val - maxV;
    }
    features[`${sigName}_dist_from_range`] = dist;

    let rate = 0.0;
    const lastVal = state.getSignal(sigName);
    const lastTs = state.getLastTimestamp(frame.arbitrationId);
    if (lastVal !== null && typeof lastVal === 'number' && lastTs !== null) {
      const dt = frame.timestamp - lastTs;
      if (dt > 0) {
        rate = (val - lastVal) / dt;
      }
    }
    features[`${sigName}_rate_of_change`] = rate;
  }

  return features;
}

// ---- Cross-Signal Feature Extractor ----
function extractCrossSignalFeatures(
  frame: RawCanFrame,
  decoded: DecodedCanMessage | null,
  state: StateTracker
): Record<string, number> {
  const features: Record<string, number> = {
    speed_engine_conflict: 0,
    speed_gear_conflict: 0,
  };

  let speed: number | string | null = state.getSignal('Vehicle_Speed');
  let engineStatus: number | string | null = state.getSignal('Engine_Status');
  let gear: number | string | null = state.getSignal('Gear_Position');

  if (decoded) {
    const vs = decoded.signals.get('Vehicle_Speed');
    if (vs) speed = vs.physicalValue;
    const es = decoded.signals.get('Engine_Status');
    if (es) engineStatus = es.physicalValue;
    const gp = decoded.signals.get('Gear_Position');
    if (gp) gear = gp.physicalValue;
  }

  if (speed !== null && engineStatus !== null) {
    const speedVal = parseFloat(String(speed));
    const isOff = engineStatus === 'OFF' || engineStatus === 0 || engineStatus === '0';
    if (speedVal > 0 && isOff) features.speed_engine_conflict = 1;
  }

  if (speed !== null && gear !== null) {
    const speedVal = parseFloat(String(speed));
    const isPark = gear === 'PARK' || gear === 0 || gear === '0';
    if (speedVal > 0 && isPark) features.speed_gear_conflict = 1;
  }

  return features;
}

// ---- Combined Pipeline ----
export interface FrameFeatureSet extends Record<string, number> {
  timestamp: number;
  can_id: number;
  dlc: number;
}

export function processFrame(
  frame: RawCanFrame,
  decoded: DecodedCanMessage | null,
  state: StateTracker
): FrameFeatureSet {
  const base: FrameFeatureSet = {
    timestamp: frame.timestamp,
    can_id: frame.arbitrationId,
    dlc: frame.dlc,
  };

  const frameFeats = extractFrameFeatures(frame, decoded);
  const timingFeats = extractTimingFeatures(frame, state);
  const signalFeats = extractSignalFeatures(frame, decoded, state);
  const crossFeats = extractCrossSignalFeatures(frame, decoded, state);

  // Update state AFTER extracting signal features (mirrors Python pipeline)
  if (decoded) state.updateSignals(decoded);

  return { ...base, ...frameFeats, ...timingFeats, ...signalFeats, ...crossFeats };
}
