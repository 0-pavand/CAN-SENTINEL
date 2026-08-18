/**
 * Incident aggregator.
 * Mirrors backend app/detectors/aggregator.py exactly.
 * Groups alerts into incidents by type within a time window.
 */

import type { AnomalyAlert } from './ruleDetectors';

export interface AnalysisIncident {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  primaryAnomalyType: string;
  severity: string;
  description: string;
  affectedCanIds: number[];
  occurrences: number;
  peakDlScore: number | null;
  allRuleEvidence: string[];
}

function getIncidentType(alert: AnomalyAlert): string {
  if (alert.isRuleViolation && alert.ruleEvidence.length > 0) {
    const primary = alert.ruleEvidence[0];
    const colonIdx = primary.indexOf(':');
    if (colonIdx !== -1) return primary.substring(0, colonIdx).trim();
    return primary;
  }
  return alert.anomalyType;
}

let incidentCounter = 0;

export function aggregateAlerts(
  alerts: AnomalyAlert[],
  timeWindow = 1.0
): AnalysisIncident[] {
  if (alerts.length === 0) return [];

  const sorted = [...alerts].sort((a, b) => a.timestamp - b.timestamp);
  const active = new Map<string, AnalysisIncident>();
  const final: AnalysisIncident[] = [];

  for (const alert of sorted) {
    const incType = getIncidentType(alert);

    if (active.has(incType)) {
      const inc = active.get(incType)!;
      if (alert.timestamp - inc.endTime <= timeWindow) {
        // Extend incident
        inc.endTime = alert.timestamp;
        inc.duration = inc.endTime - inc.startTime;
        inc.occurrences++;

        if (alert.canId !== null && !inc.affectedCanIds.includes(alert.canId)) {
          inc.affectedCanIds.push(alert.canId);
        }

        if (alert.dlScore !== undefined) {
          if (inc.peakDlScore === null || alert.dlScore > inc.peakDlScore) {
            inc.peakDlScore = alert.dlScore;
          }
        }

        for (const ev of alert.ruleEvidence) {
          if (!inc.allRuleEvidence.includes(ev)) inc.allRuleEvidence.push(ev);
        }

        // Upgrade severity
        if (alert.severity === 'CRITICAL') inc.severity = 'CRITICAL';
        else if (alert.severity === 'HIGH' && inc.severity !== 'CRITICAL') inc.severity = 'HIGH';

        continue;
      } else {
        final.push(inc);
        active.delete(incType);
      }
    }

    // New incident
    active.set(incType, {
      id: `inc-${++incidentCounter}`,
      startTime: alert.timestamp,
      endTime: alert.timestamp,
      duration: 0,
      primaryAnomalyType: incType,
      severity: alert.severity,
      description: alert.description,
      affectedCanIds: alert.canId !== null ? [alert.canId] : [],
      occurrences: 1,
      peakDlScore: alert.dlScore ?? null,
      allRuleEvidence: [...alert.ruleEvidence],
    });
  }

  // Flush remaining
  for (const inc of active.values()) final.push(inc);

  return final.sort((a, b) => a.startTime - b.startTime);
}
