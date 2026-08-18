/**
 * Rule-based anomaly detectors.
 * Mirrors backend app/detectors/rule_based.py exactly.
 * Five detectors: BoundsDetector, FloodDetector, LogicalContradictionDetector,
 * TimeoutDetector, CorruptionDetector.
 */

import type { StateTracker } from './featurePipeline';

export interface AnomalyAlert {
  timestamp: number;
  canId: number | null;
  anomalyType: string;
  severity: string;
  description: string;
  isRuleViolation: boolean;
  dlScore?: number;
  ruleEvidence: string[];
}

// A1: Out of range
export function boundsDetector(features: Record<string, number>): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  for (const [key, val] of Object.entries(features)) {
    if (key.endsWith('_dist_from_range') && val > 0) {
      const signalName = key.replace('_dist_from_range', '');
      alerts.push({
        timestamp: features.timestamp,
        canId: features.can_id ?? null,
        anomalyType: 'Out-of-Range',
        severity: 'CRITICAL',
        description: `${signalName} is out of bounds (distance: ${val})`,
        isRuleViolation: true,
        ruleEvidence: [`Rule [Out-of-Range]: ${signalName} distance ${val}`],
      });
    }
  }
  return alerts;
}

// A2: Timing Flood
export function floodDetector(
  features: Record<string, number>,
  deviationThreshold = 0.005
): AnomalyAlert[] {
  const dev = features.timing_deviation ?? 0;
  const dt = features.delta_time ?? 0;
  const burst = features.burst_rate ?? 0;

  if (burst > 0 && dev > deviationThreshold && dt > 0 && dt < 0.005) {
    return [
      {
        timestamp: features.timestamp,
        canId: features.can_id ?? null,
        anomalyType: 'Timing Flood',
        severity: 'HIGH',
        description: `Message arriving too fast (dt=${dt.toFixed(4)}s)`,
        isRuleViolation: true,
        ruleEvidence: [`Rule [Timing Flood]: deviation=${dev.toFixed(4)}, burst=${burst.toFixed(2)}`],
      },
    ];
  }
  return [];
}

// A3: Logical contradictions
export function logicalContradictionDetector(features: Record<string, number>): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  if (features.speed_engine_conflict === 1) {
    alerts.push({
      timestamp: features.timestamp,
      canId: features.can_id ?? null,
      anomalyType: 'Logical Contradiction',
      severity: 'CRITICAL',
      description: 'Vehicle Speed > 0 while Engine is OFF',
      isRuleViolation: true,
      ruleEvidence: ['Rule [Logical Contradiction]: speed_engine_conflict'],
    });
  }
  if (features.speed_gear_conflict === 1) {
    alerts.push({
      timestamp: features.timestamp,
      canId: features.can_id ?? null,
      anomalyType: 'Logical Contradiction',
      severity: 'CRITICAL',
      description: 'Vehicle Speed > 0 while Gear is PARK',
      isRuleViolation: true,
      ruleEvidence: ['Rule [Logical Contradiction]: speed_gear_conflict'],
    });
  }
  return alerts;
}

// A4: Missing cyclic messages
export class TimeoutDetector {
  private firedTimeouts = new Map<number, number>();
  private readonly multiplier: number;

  constructor(timeoutMultiplier = 3.0) {
    this.multiplier = timeoutMultiplier;
  }

  evaluate(features: Record<string, number>, state: StateTracker): AnomalyAlert[] {
    const alerts: AnomalyAlert[] = [];
    const currentTs = features.timestamp;

    for (const [canId, lastSeen] of state.lastSeenTimestamps) {
      const expected = state.getExpectedCycle(canId);
      if (expected > 0) {
        const elapsed = currentTs - lastSeen;
        if (elapsed > expected * this.multiplier) {
          const lastFired = this.firedTimeouts.get(canId);
          if (lastFired === undefined || currentTs - lastFired > expected) {
            alerts.push({
              timestamp: currentTs,
              canId,
              anomalyType: 'Missing Timeout',
              severity: 'CRITICAL',
              description: `Message 0x${canId.toString(16).toUpperCase().padStart(3, '0')} timed out (elapsed ${elapsed.toFixed(4)}s > ${(expected * this.multiplier).toFixed(4)}s)`,
              isRuleViolation: true,
              ruleEvidence: [`Rule [Missing Timeout]: canId=0x${canId.toString(16).toUpperCase()}`],
            });
            this.firedTimeouts.set(canId, currentTs);
          }
        }
      }
    }
    return alerts;
  }
}

// A5: Data corruption patterns
export function corruptionDetector(features: Record<string, number>): AnomalyAlert[] {
  const msg: string[] = [];
  const evidence: string[] = [];

  if (features.all_ff === 1) { msg.push('All 0xFF payload'); evidence.push('all_ff'); }
  if (features.all_zero === 1) { msg.push('All 0x00 payload'); evidence.push('all_zero'); }
  if (features.aa_55_pattern === 1) { msg.push('AA/55 test pattern'); evidence.push('aa_55'); }
  if (features.dlc_match === 0) { msg.push('DLC mismatch'); evidence.push('dlc_mismatch'); }

  if (msg.length > 0) {
    return [
      {
        timestamp: features.timestamp,
        canId: features.can_id ?? null,
        anomalyType: 'Data Corruption',
        severity: 'CRITICAL',
        description: msg.join(', '),
        isRuleViolation: true,
        ruleEvidence: evidence.map(e => `Rule [Data Corruption]: ${e}`),
      },
    ];
  }
  return [];
}

// Engine: runs all rule detectors on one feature set
export function runAllRuleDetectors(
  features: Record<string, number>,
  state: StateTracker,
  timeoutDetector: TimeoutDetector
): AnomalyAlert[] {
  return [
    ...boundsDetector(features),
    ...floodDetector(features),
    ...logicalContradictionDetector(features),
    ...timeoutDetector.evaluate(features, state),
    ...corruptionDetector(features),
  ];
}
