export type AnomalyCategory = 
  | 'Data Corruption' 
  | 'Message Timeout' 
  | 'Timing/Flood' 
  | 'Logical Contradiction' 
  | 'Engine RPM Out-of-Range' 
  | 'Unknown';

export interface DiagnosticKnowledge {
  explanation: string;
  causes: string;
  checks: string;
  severityGuidance: string;
}

export const KNOWLEDGE_BASE: Record<AnomalyCategory, DiagnosticKnowledge> = {
  'Data Corruption': {
    explanation: "The system detected malformed or corrupted CAN frames. This means the digital messages on the network are broken or unreadable by the time they reach the receiver.",
    causes: "This is typically a physical layer issue. It may be caused by severe electromagnetic interference (EMI), a damaged wiring harness, loose grounding, or water intrusion in a connector.",
    checks: "1. Inspect the main CAN bus wiring harness for visible damage, chafing, or exposed wires.\n2. Check grounding points for corrosion.\n3. Verify terminating resistor values (typically 60 ohms across CAN High and CAN Low with the battery disconnected).\n4. Ensure no aftermarket electronics are inducing EMI.",
    severityGuidance: "Critical. Data corruption can cause sudden module offline events or unpredictable vehicle behavior. The vehicle should not be driven until the physical network is verified by a professional."
  },
  'Message Timeout': {
    explanation: "An expected periodic message did not arrive within its required time window. A module on the network has stopped broadcasting.",
    causes: "The broadcasting module may have lost power, crashed, or disconnected from the bus. It could also indicate a severed communication line to that specific node.",
    checks: "1. Check the fuse for the affected module (e.g., ABS, ECM).\n2. Inspect the connector plugging into the module for loose pins or water damage.\n3. Verify power and ground at the module connector.",
    severityGuidance: "High to Critical depending on the module. If a critical safety system (like ABS or Airbags) has timed out, professional diagnosis is required immediately."
  },
  'Timing/Flood': {
    explanation: "A module is transmitting messages at an abnormally high rate, dominating the network bandwidth.",
    causes: "This can be caused by a faulty module continuously resetting, a software bug ('babbling idiot' syndrome), or a compromised aftermarket device attached to the OBD-II port.",
    checks: "1. Disconnect any aftermarket devices (insurance trackers, tune boxes) from the OBD-II port.\n2. Note if the issue correlates with a specific vehicle action (e.g., turning on the radio or AC).\n3. A professional scan tool may be required to isolate which module is flooding the bus.",
    severityGuidance: "Medium to High. A flooded bus can delay legitimate safety-critical messages. If disconnecting aftermarket devices does not resolve it, seek professional help."
  },
  'Logical Contradiction': {
    explanation: "Two or more signals broadcast on the network contradict each other physically. For example, the vehicle speed is reported as high while the transmission is reported in Park.",
    causes: "A sensor is likely reporting faulty data, or a module is calculating states incorrectly. It is rarely a wire issue and usually a faulty sensor or module internal logic error.",
    checks: "1. Check the specific sensor data using a diagnostic scan tool (e.g., wheel speed sensors vs. transmission output shaft speed).\n2. Look for related sensor-specific DTCs (Diagnostic Trouble Codes).\n3. Verify the sensor wiring and connector.",
    severityGuidance: "Medium. This indicates a sensor or logic failure rather than a complete network collapse. However, it can disable advanced driver assistance systems (ADAS) or ABS."
  },
  'Engine RPM Out-of-Range': {
    explanation: "The Engine RPM signal exceeded the absolute maximum expected value (e.g., > 10,000 RPM) or reported an impossible sudden jump.",
    causes: "The Crankshaft Position Sensor (CKP), its wiring, or the Engine Control Module (ECM) processing the signal is faulty.",
    checks: "1. Inspect the Crankshaft Position Sensor (CKP) and Camshaft Position Sensor (CMP) wiring for damage or proximity to high-heat sources (exhaust).\n2. Check for oil or debris on the sensor face.\n3. Scan the ECM for related Engine Speed DTCs.",
    severityGuidance: "High. An erratic RPM signal can cause engine stalling, misfires, or prevent the vehicle from starting. Have the sensor and ECM checked."
  },
  'Unknown': {
    explanation: "The system detected an anomaly pattern that deviates from normal baseline traffic, but it does not match a specific known deterministic rule.",
    causes: "This could be an intermittent electrical issue, an early sign of a failing component, or a highly specific situational glitch that the deep learning model identified as abnormal.",
    checks: "1. Monitor if the vehicle exhibits any actual drivability symptoms.\n2. Check if the issue occurs under specific conditions (e.g., hitting a bump, turning the steering wheel).\n3. Check for any pending DTCs with a scanner.",
    severityGuidance: "Low to Medium. If there are no noticeable driving symptoms and no warning lights, this may be a minor transient anomaly. Continue monitoring, but seek help if symptoms develop."
  }
};

export function categorizeAnomaly(typeStr: string): AnomalyCategory {
  const t = typeStr.toLowerCase();
  if (t.includes('corruption')) return 'Data Corruption';
  if (t.includes('timeout')) return 'Message Timeout';
  if (t.includes('flood') || t.includes('timing')) return 'Timing/Flood';
  if (t.includes('contradiction')) return 'Logical Contradiction';
  if (t.includes('rpm') || t.includes('out-of-range') || t.includes('bounds')) return 'Engine RPM Out-of-Range';
  return 'Unknown';
}
