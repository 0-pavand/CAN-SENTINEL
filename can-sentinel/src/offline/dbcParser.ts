/**
 * Minimal DBC parser.
 * Supports BO_ (message) and SG_ (signal) definitions.
 * Handles Intel (little-endian) and Motorola (big-endian) byte order.
 * Mirrors the subset of cantools used by backend/app/dbc/decoder.py.
 */

export interface DbcSignal {
  name: string;
  startBit: number;
  length: number;
  isLittleEndian: boolean; // Intel=1, Motorola=0
  isSigned: boolean;
  factor: number;
  offset: number;
  minimum: number | null;
  maximum: number | null;
  choices: Record<number, string>;
  unit: string;
}

export interface DbcMessage {
  id: number;
  name: string;
  length: number; // DLC
  signals: DbcSignal[];
}

export interface DbcDatabase {
  messages: Map<number, DbcMessage>;
}

export function parseDbcFile(content: string): DbcDatabase {
  const messages = new Map<number, DbcMessage>();
  const lines = content.split('\n');

  let currentMsg: DbcMessage | null = null;
  // Accumulate value_def lines for choices
  const valueDefs: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Message definition: BO_ <id> <name>: <length> <transmitter>
    const boMatch = line.match(/^BO_\s+(\d+)\s+(\w+)\s*:\s*(\d+)\s+\w+/);
    if (boMatch) {
      currentMsg = {
        id: parseInt(boMatch[1], 10),
        name: boMatch[2],
        length: parseInt(boMatch[3], 10),
        signals: [],
      };
      messages.set(currentMsg.id, currentMsg);
      continue;
    }

    // Signal definition: SG_ <name> : <startBit>|<len>@<byteOrder><valueType> (<factor>,<offset>) [<min>|<max>] "<unit>" <receivers>
    const sgMatch = line.match(
      /^\s*SG_\s+(\w+)\s+:\s+(\d+)\|(\d+)@([01])([+-])\s+\(([^,]+),([^)]+)\)\s+\[([^|]*)\|([^\]]*)\]\s+"([^"]*)"/
    );
    if (sgMatch && currentMsg) {
      const minimum = sgMatch[8] !== '' ? parseFloat(sgMatch[8]) : null;
      const maximum = sgMatch[9] !== '' ? parseFloat(sgMatch[9]) : null;
      const sig: DbcSignal = {
        name: sgMatch[1],
        startBit: parseInt(sgMatch[2], 10),
        length: parseInt(sgMatch[3], 10),
        isLittleEndian: sgMatch[4] === '1',
        isSigned: sgMatch[5] === '-',
        factor: parseFloat(sgMatch[6]),
        offset: parseFloat(sgMatch[7]),
        minimum: isNaN(minimum as number) ? null : minimum,
        maximum: isNaN(maximum as number) ? null : maximum,
        choices: {},
        unit: sgMatch[10],
      };
      currentMsg.signals.push(sig);
      continue;
    }

    // Value definitions: VAL_ <msgId> <sigName> <val> "<label>" ... ;
    if (line.startsWith('VAL_')) {
      valueDefs.push(line);
    }
  }

  // Parse value definitions and attach choices to signals
  for (const vline of valueDefs) {
    // VAL_ 100 Engine_Status 0 "OFF" 1 "ON" ;
    const vMatch = vline.match(/^VAL_\s+(\d+)\s+(\w+)\s+(.+?)\s*;/);
    if (!vMatch) continue;
    const msgId = parseInt(vMatch[1], 10);
    const sigName = vMatch[2];
    const rest = vMatch[3];
    const msg = messages.get(msgId);
    if (!msg) continue;
    const sig = msg.signals.find(s => s.name === sigName);
    if (!sig) continue;
    // Parse pairs: <number> "<label>"
    const pairRe = /(\d+)\s+"([^"]*)"/g;
    let pm: RegExpExecArray | null;
    while ((pm = pairRe.exec(rest)) !== null) {
      sig.choices[parseInt(pm[1], 10)] = pm[2];
    }
  }

  return { messages };
}

export interface DecodedSignalValue {
  name: string;
  rawValue: number;
  physicalValue: number | string;
  unit: string;
  validRange: [number, number] | null;
  enumLabel: string | null;
}

export interface DecodedCanMessage {
  timestamp: number;
  canId: number;
  messageName: string;
  signals: Map<string, DecodedSignalValue>;
}

function extractSignalBits(data: Uint8Array, sig: DbcSignal): number {
  if (sig.isLittleEndian) {
    // Intel byte order (LSB first)
    let value = 0n;
    const startBit = sig.startBit;
    for (let i = 0; i < sig.length; i++) {
      const bitPos = startBit + i;
      const byteIdx = Math.floor(bitPos / 8);
      const bitIdx = bitPos % 8;
      if (byteIdx < data.length) {
        const bit = (data[byteIdx] >> bitIdx) & 1;
        value |= BigInt(bit) << BigInt(i);
      }
    }
    // Handle signed
    if (sig.isSigned && sig.length > 0) {
      const signBit = 1n << BigInt(sig.length - 1);
      if (value & signBit) {
        value -= 1n << BigInt(sig.length);
      }
    }
    return Number(value);
  } else {
    // Motorola byte order (MSB first)
    let value = 0n;
    const startBit = sig.startBit;
    // Convert Motorola start bit to bit positions
    for (let i = 0; i < sig.length; i++) {
      // Motorola: startBit is the MSB position
      // bit position in stream (MSB first)
      const msbBit = startBit;
      const bitOffset = i;
      // row and column in the byte array (Motorola)
      const row = Math.floor(msbBit / 8);
      const col = msbBit % 8;
      // actual bit position
      const byteRow = row + Math.floor((col - bitOffset) < 0 ? (bitOffset - col + 7) / 8 : 0);
      const bitCol = ((col - bitOffset) % 8 + 8) % 8;
      const byteIdx = row + Math.floor((col - bitOffset < 0) ? Math.ceil((bitOffset - col) / 8) : 0);

      // Simplified: use linear bit addressing for Motorola
      // Start from startBit MSB, go sequentially
      const linearBit = startBit - i + Math.floor(i / 8) * 16 - (7 - (startBit % 8)) * 2;
      const bIdx = Math.floor(linearBit / 8);
      const bOff = 7 - (linearBit % 8);
      let bit = 0;
      if (bIdx >= 0 && bIdx < data.length) {
        bit = (data[bIdx] >> bOff) & 1;
      }
      value |= BigInt(bit) << BigInt(sig.length - 1 - i);
    }
    if (sig.isSigned && sig.length > 0) {
      const signBit = 1n << BigInt(sig.length - 1);
      if (value & signBit) {
        value -= 1n << BigInt(sig.length);
      }
    }
    return Number(value);
  }
}

export function decodeFrame(
  data: Uint8Array,
  msg: DbcMessage,
  timestamp: number
): DecodedCanMessage {
  const signals = new Map<string, DecodedSignalValue>();

  for (const sig of msg.signals) {
    const rawValue = extractSignalBits(data, sig);
    const physRaw = rawValue * sig.factor + sig.offset;
    let physicalValue: number | string = physRaw;
    let enumLabel: string | null = null;

    if (Object.keys(sig.choices).length > 0) {
      const label = sig.choices[rawValue];
      if (label !== undefined) {
        physicalValue = label;
        enumLabel = label;
      }
    }

    const validRange: [number, number] | null =
      sig.minimum !== null && sig.maximum !== null ? [sig.minimum, sig.maximum] : null;

    signals.set(sig.name, {
      name: sig.name,
      rawValue: physRaw, // Use physical for raw (consistent with cantools decode_choices=False for numeric)
      physicalValue,
      unit: sig.unit,
      validRange,
      enumLabel,
    });
  }

  return { timestamp, canId: msg.id, messageName: msg.name, signals };
}
