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
 * Must be called from a user gesture (Chrome asks for NFC permission).
 *
 * The reader deliberately KEEPS RUNNING after the card has been read, until
 * `signal` is aborted. While a page holds an active scan, Chrome owns NFC; the
 * moment the scan stops, Android hands the (still nearby) tag to its own tag
 * viewer and pops a system "New tag scanned" screen over the payment. Further
 * taps during the payment are read and ignored. Abort `signal` when the payment
 * flow ends (cancelled, failed, paid, or the component unmounts).
 *
 * A tag that is not a CBC card does not end the scan: `onNotice` is told and we
 * keep waiting for the right card.
 */
export async function readCardTap(
  signal: AbortSignal,
  onNotice?: (message: string) => void
): Promise<NfcCardRead> {
  const Reader = readerConstructor();
  if (!Reader || !window.isSecureContext) {
    throw new NfcReadError("unsupported", "Tap to pay works on Chrome for Android over a secure connection.");
  }
  if (signal.aborted) throw new NfcReadError("aborted", "Cancelled.");

  const reader = new Reader();
  const scan = new AbortController();
  const stopScan = () => {
    reader.onreading = null;
    reader.onreadingerror = null;
    scan.abort();
  };
  signal.addEventListener("abort", stopScan, { once: true });

  try {
    await reader.scan({ signal: scan.signal });
  } catch (error) {
    signal.removeEventListener("abort", stopScan);
    throw signal.aborted ? new NfcReadError("aborted", "Cancelled.") : scanFailure(error);
  }

  return new Promise<NfcCardRead>((resolve, reject) => {
    let settled = false;

    const onSignalAbort = () => {
      if (settled) return;
      settled = true;
      reject(new NfcReadError("aborted", "Cancelled."));
    };
    if (signal.aborted) {
      onSignalAbort();
      return;
    }
    signal.addEventListener("abort", onSignalAbort, { once: true });

    reader.onreading = (event) => {
      // Once a card has been accepted, keep the scan alive but ignore any later tap.
      if (settled) return;
      const payload = extractCardPayload(event.message?.records ?? []);
      const uid = normalizeUid(event.serialNumber);
      if (!payload || !uid) {
        onNotice?.("That is not a CBC card. Tap your CBC card to continue.");
        return;
      }
      settled = true;
      signal.removeEventListener("abort", onSignalAbort);
      resolve({ uid, payload });
    };
    reader.onreadingerror = () => {
      if (settled) return;
      onNotice?.("Could not read the card. Hold it steady against the back of your phone.");
    };
  });
}
