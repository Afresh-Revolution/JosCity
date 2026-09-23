// Reads a CBC card over Web NFC (Chrome on Android, HTTPS only — iOS Safari does
// not support it). The card carries an NDEF text record "RGC1:<hex ciphertext>"
// and the tag's serial number (UID). We only ever extract those two raw values
// and hand them to the JosCity server, which decrypts them; the decrypted card
// number/CVC never reach the browser.

export type NfcCardRead = {
  /** Tag serial number, upper-case hex without separators. */
  uid: string;
  /** Hex ciphertext that followed the "RGC1:" prefix. */
  payload: string;
};

export type NfcReadErrorCode =
  | "unsupported"
  | "permission"
  | "aborted"
  | "not_cbc"
  | "read_error"
  | "failed";

export class NfcReadError extends Error {
  code: NfcReadErrorCode;

  constructor(code: NfcReadErrorCode, message: string) {
    super(message);
    this.name = "NfcReadError";
    this.code = code;
  }
}

const NDEF_PREFIX = "RGC1:";

interface NdefRecordLike {
  recordType: string;
  mediaType?: string;
  encoding?: string;
  data?: DataView;
}

interface NdefReadingEventLike extends Event {
  serialNumber: string;
  message?: { records: NdefRecordLike[] };
}

interface NdefReaderLike {
  scan(options?: { signal?: AbortSignal }): Promise<void>;
  onreading: ((event: NdefReadingEventLike) => void) | null;
  onreadingerror: ((event: Event) => void) | null;
}

type NdefReaderConstructor = new () => NdefReaderLike;

function readerConstructor(): NdefReaderConstructor | null {
  if (typeof window === "undefined") return null;
  const ctor = (window as unknown as { NDEFReader?: NdefReaderConstructor }).NDEFReader;
  return ctor ?? null;
}

export function isWebNfcSupported(): boolean {
  return typeof window !== "undefined" && window.isSecureContext && readerConstructor() !== null;
}

function normalizeUid(value: string | undefined): string {
  return String(value ?? "")
    .replace(/[^0-9a-fA-F]/g, "")
    .toUpperCase();
}

function decodeText(data: DataView | undefined, encoding?: string): string {
  if (!data) return "";
  const label = String(encoding || "utf-8").toLowerCase();
  const map: Record<string, string> = {
    "utf-8": "utf-8",
    utf8: "utf-8",
    "utf-16": "utf-16le",
    utf16: "utf-16le",
  };
  try {
    return new TextDecoder(map[label] || label).decode(data);
  } catch {
    try {
      return new TextDecoder("utf-8").decode(data);
    } catch {
      return "";
    }
  }
}

function bytesToLatin1(data: DataView | undefined): string {
  if (!data) return "";
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  let text = "";
  for (let i = 0; i < bytes.length; i += 1) text += String.fromCharCode(bytes[i]);
  return text;
}

function hexAfterPrefix(text: string): string {
  return text
    .slice(text.indexOf(NDEF_PREFIX) + NDEF_PREFIX.length)
    .replace(/[^0-9a-fA-F]/g, "")
    .toUpperCase();
}

/** Finds the "RGC1:" record on the tag and returns its hex ciphertext, or "". */
export function extractCardPayload(records: NdefRecordLike[]): string {
  for (const record of records) {
    let text: string | null = null;
    try {
      if (record.recordType === "text") {
        text = decodeText(record.data, record.encoding);
      } else if (record.recordType === "mime" && (record.mediaType || "").toLowerCase().startsWith("text/")) {
        text = decodeText(record.data, "utf-8");
      }
    } catch {
      text = null;
    }
    if (text && text.includes(NDEF_PREFIX)) return hexAfterPrefix(text);

    const latin = bytesToLatin1(record.data);
    if (latin.includes(NDEF_PREFIX)) return hexAfterPrefix(latin);
  }
  return "";
}

function scanFailure(error: unknown): NfcReadError {
  const name = error instanceof DOMException || error instanceof Error ? error.name : "";
  if (name === "NotAllowedError") {
    return new NfcReadError("permission", "NFC permission was denied. Allow NFC for this site and try again.");
  }
  if (name === "NotSupportedError") {
    return new NfcReadError("unsupported", "NFC is not available on this device. Turn NFC on in your phone settings.");
  }
  if (name === "AbortError") {
    return new NfcReadError("aborted", "Cancelled.");
  }
  return new NfcReadError("failed", "Could not start the NFC reader. Check that NFC is turned on and try again.");
}

/**
 * Starts the phone's NFC reader and resolves with the first CBC card tapped.
 * Must be called from a user gesture (Chrome asks for NFC permission). Aborting
 * `signal` stops the reader and rejects with code "aborted".
 */
export async function readCardTap(signal: AbortSignal): Promise<NfcCardRead> {
  const Reader = readerConstructor();
  if (!Reader || !window.isSecureContext) {
    throw new NfcReadError("unsupported", "Tap to pay works on Chrome for Android over a secure connection.");
  }
  if (signal.aborted) throw new NfcReadError("aborted", "Cancelled.");

  const reader = new Reader();
  const scan = new AbortController();
  const onAbort = () => scan.abort();
  signal.addEventListener("abort", onAbort);

  try {
    await reader.scan({ signal: scan.signal });
  } catch (error) {
    signal.removeEventListener("abort", onAbort);
    throw signal.aborted ? new NfcReadError("aborted", "Cancelled.") : scanFailure(error);
  }

  return new Promise<NfcCardRead>((resolve, reject) => {
    const cancelled = () => {
      finish();
      reject(new NfcReadError("aborted", "Cancelled."));
    };
    const finish = () => {
      signal.removeEventListener("abort", onAbort);
      signal.removeEventListener("abort", cancelled);
      reader.onreading = null;
      reader.onreadingerror = null;
      scan.abort();
    };

    if (signal.aborted) {
      cancelled();
      return;
    }
    signal.addEventListener("abort", cancelled);

    reader.onreading = (event) => {
      const payload = extractCardPayload(event.message?.records ?? []);
      const uid = normalizeUid(event.serialNumber);
      finish();
      if (!payload || !uid) {
        reject(new NfcReadError("not_cbc", "That is not a CBC card. Tap your CBC card and try again."));
        return;
      }
      resolve({ uid, payload });
    };
    reader.onreadingerror = () => {
      finish();
      reject(new NfcReadError("read_error", "Could not read the card. Hold it steady against the back of your phone and try again."));
    };
  });
}
