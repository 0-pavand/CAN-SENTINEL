/** Raw CAN frame as parsed from .log/.asc file */
export interface RawCanFrame {
  timestamp: number;
  channel: string;
  arbitrationId: number;
  direction: string;
  dlc: number;
  data: Uint8Array;
}

/**
 * Parses a CAN .log / .asc file (Vector ASC format).
 * Format: "4.023105 1  0C9  Rx  d 8  FF FF 00 00 AA BB CC DD"
 * Mirrors backend app/parsers/asc_parser.py exactly.
 */
export function parseAscLog(content: string): RawCanFrame[] {
  const frames: RawCanFrame[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    if (
      raw.startsWith('//') ||
      raw.startsWith('date') ||
      raw.startsWith('base') ||
      raw.startsWith('begin') ||
      raw.startsWith('end') ||
      raw.startsWith('internal')
    ) continue;

    const frame = parseLine(raw);
    if (frame) frames.push(frame);
  }

  return frames;
}

function parseLine(line: string): RawCanFrame | null {
  const parts = line.split(/\s+/);
  try {
    if (parts.length < 6) return null;
    const timestampStr = parts[0];
    const channel = parts[1];
    const canIdStr = parts[2];
    const direction = parts[3];
    const frameType = parts[4];
    const dlcStr = parts[5];

    if (!['Rx', 'Tx'].includes(direction)) return null;
    if (!['d', 'r'].includes(frameType)) return null;

    const timestamp = parseFloat(timestampStr);
    if (isNaN(timestamp)) return null;
    const arbitrationId = parseInt(canIdStr, 16);
    if (isNaN(arbitrationId)) return null;
    const dlc = parseInt(dlcStr, 10);
    if (isNaN(dlc)) return null;

    const payloadParts = parts.slice(6, 6 + dlc);
    if (payloadParts.length < dlc) return null;

    const data = new Uint8Array(payloadParts.map(h => parseInt(h, 16)));
    return { timestamp, channel, arbitrationId, direction, dlc, data };
  } catch {
    return null;
  }
}
