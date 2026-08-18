import { AnomalyIncident } from '../types';

export interface DiagnosticInfo {
  title: string;
  explanation: string;
  affectedArea: string;
  troubleshooting: string[];
}

export function getDiagnosticInfo(incident: AnomalyIncident): DiagnosticInfo {
  const type = incident.anomalyType.toUpperCase();
  const evidence = incident.ruleEvidence.toLowerCase();

  let title = "Unknown CAN Communication Issue";
  let explanation = "The system detected an unusual pattern in the vehicle's internal communication network.";
  let affectedArea = "Vehicle Network";
  let troubleshooting = [
    "Verify the sensor connections for the affected components.",
    "Check the wiring harness for signs of wear or interference."
  ];

  if (type.includes('BOUNDS_VIOLATION') || type.includes('OUT OF RANGE')) {
    title = "Sensor Value Out of Range";
    explanation = "A vehicle sensor reported a value that exceeds its normal physical operating limits.";
    
    if (evidence.includes('engine') || evidence.includes('rpm')) {
      affectedArea = "Engine Control Module (ECM)";
      troubleshooting = [
        "Check engine RPM sensor (crankshaft/camshaft position sensor) for faults.",
        "Inspect wiring to the ECM for shorts or loose connections.",
        "If the vehicle is operating normally, this may be a transient sensor glitch."
      ];
    } else if (evidence.includes('speed')) {
      affectedArea = "Transmission / ABS Module";
      troubleshooting = [
        "Inspect wheel speed sensors for debris or damage.",
        "Verify the integrity of the wiring harness connecting to the ABS module."
      ];
    }
  } else if (type.includes('FLOOD_DETECTED') || type.includes('MESSAGE FLOOD')) {
    title = "Network Message Flood (Possible DoS)";
    explanation = "An unusually high volume of messages was broadcast on the network in a very short time, which can overwhelm the vehicle's systems.";
    affectedArea = "CAN Bus / Gateway";
    troubleshooting = [
      "Check for a faulty electronic control unit (ECU) that is constantly rebooting or transmitting.",
      "Inspect OBD-II port for unauthorized aftermarket devices (dongles, trackers).",
      "Perform a hard reset of the vehicle network if safe to do so."
    ];
  } else if (type.includes('LOGICAL_CONTRADICTION')) {
    title = "Conflicting Vehicle State Detected";
    explanation = "Two or more sensors are reporting vehicle states that cannot physically happen at the same time (e.g., vehicle moving while engine is off).";
    affectedArea = "Multiple Control Modules";
    
    if (evidence.includes('speed') && evidence.includes('engine')) {
      troubleshooting = [
        "Verify communication between the Engine Control Module (ECM) and Transmission Control Module (TCM).",
        "Check for delayed sensor reporting or buffering issues on the CAN bus.",
        "If vehicle speed is reported while engine is off, inspect the wheel speed sensors."
      ];
    } else {
      troubleshooting = [
        "Check for firmware mismatches between connected ECUs.",
        "Inspect the CAN bus for message spoofing or injection."
      ];
    }
  } else if (type.includes('TIMEOUT') || type.includes('MISSING')) {
    title = "Critical Component Unresponsive";
    explanation = "A required electronic module stopped broadcasting its status messages within the expected time window.";
    affectedArea = "Specific ECU / CAN Bus";
    troubleshooting = [
      "Check the power supply and ground connections to the affected module.",
      "Inspect the CAN High / CAN Low wires for open circuits.",
      "Verify if the module has entered a sleep or fault state."
    ];
  } else if (type.includes('DATA_CORRUPTION') || type.includes('CORRUPTION')) {
    title = "Corrupted Network Data";
    explanation = "Data packets received on the network were malformed, truncated, or contained invalid lengths.";
    affectedArea = "CAN Bus Physical Layer";
    troubleshooting = [
      "Check terminating resistors on the CAN bus (should measure ~60 ohms).",
      "Inspect wiring for electromagnetic interference (EMI) from high-voltage components.",
      "Look for chafed wires causing intermittent shorts to ground."
    ];
  } else if (type.includes('ANOMALY_DETECTED') || type.includes('DL') || type.includes('HYBRID')) {
    title = "Unrecognized Behavioral Anomaly";
    explanation = "The AI detection engine identified a complex behavioral pattern that strongly deviates from normal vehicle operation, though it doesn't match a simple rule.";
    affectedArea = "System-Wide";
    troubleshooting = [
      "Review the specific CAN IDs involved to isolate the affected modules.",
      "Compare the event timestamp with any physical symptoms observed by the driver.",
      "Run a full diagnostic scan using a professional OBD-II tool to retrieve specific DTCs."
    ];
  }

  // Adjust guidance based on severity
  if (incident.severity === 'Critical' || incident.severity === 'High') {
    troubleshooting.unshift("⚠️ IMPORTANT: Do not operate the vehicle until a professional diagnostic scan is performed.");
  } else {
    troubleshooting.push("Clear the code or monitor the system to see if the anomaly returns.");
  }

  return {
    title,
    explanation,
    affectedArea,
    troubleshooting
  };
}
