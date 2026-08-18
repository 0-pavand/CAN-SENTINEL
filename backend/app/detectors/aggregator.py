from typing import List, Dict, Any, Set
from app.api.schemas import ApiAnomalyAlert, ApiAnomalyIncident

class IncidentAggregator:
    def __init__(self, time_window: float = 1.0):
        self.time_window = time_window

    def _get_incident_type(self, alert: ApiAnomalyAlert) -> str:
        # We group by the specific rule evidence if it's a rule violation,
        # otherwise by the generic anomaly type.
        if alert.is_rule_violation and alert.rule_evidence:
            # We use the first rule as the primary grouping key
            # For example "Rule [Missing Timeout]: Message 0x1B0 timed out..."
            # We can extract the rule name inside the brackets or use the whole string.
            # A simple approach: use the part before the colon
            primary_ev = alert.rule_evidence[0]
            if ":" in primary_ev:
                return primary_ev.split(":")[0].strip()
            return primary_ev
        return alert.anomaly_type

    def aggregate(self, alerts: List[ApiAnomalyAlert]) -> List[ApiAnomalyIncident]:
        if not alerts:
            return []

        # Sort alerts by timestamp just in case
        alerts = sorted(alerts, key=lambda a: a.timestamp)

        # Dictionary to hold active incidents: { incident_type: ApiAnomalyIncident }
        active_incidents: Dict[str, dict] = {}
        final_incidents: List[dict] = []

        for alert in alerts:
            incident_type = self._get_incident_type(alert)
            
            if incident_type in active_incidents:
                active = active_incidents[incident_type]
                # Check time window
                if alert.timestamp - active["end_time"] <= self.time_window:
                    # Extend incident
                    active["end_time"] = alert.timestamp
                    active["duration"] = active["end_time"] - active["start_time"]
                    active["occurrences"] += 1
                    
                    if alert.can_id is not None and alert.can_id not in active["affected_can_ids"]:
                        active["affected_can_ids"].append(alert.can_id)
                        
                    if alert.dl_score is not None:
                        if active["peak_dl_score"] is None or alert.dl_score > active["peak_dl_score"]:
                            active["peak_dl_score"] = alert.dl_score
                            
                    if alert.rule_evidence:
                        for ev in alert.rule_evidence:
                            if ev not in active["all_rule_evidence"]:
                                active["all_rule_evidence"].append(ev)
                                
                    # Upgrade severity if necessary
                    if alert.severity == "Critical":
                        active["severity"] = "Critical"
                    elif alert.severity == "High" and active["severity"] != "Critical":
                        active["severity"] = "High"
                        
                    continue
                else:
                    # Time window exceeded, retire active incident
                    final_incidents.append(active)
                    del active_incidents[incident_type]

            # Start new incident
            active_incidents[incident_type] = {
                "start_time": alert.timestamp,
                "end_time": alert.timestamp,
                "duration": 0.0,
                "primary_anomaly_type": incident_type,
                "severity": alert.severity,
                "description": alert.description,
                "affected_can_ids": [alert.can_id] if alert.can_id is not None else [],
                "occurrences": 1,
                "peak_dl_score": alert.dl_score,
                "all_rule_evidence": list(alert.rule_evidence) if alert.rule_evidence else []
            }

        # Flush remaining active incidents
        for inc in active_incidents.values():
            final_incidents.append(inc)

        # Convert to objects
        result = [ApiAnomalyIncident(**inc) for inc in final_incidents]
        return sorted(result, key=lambda i: i.start_time)
