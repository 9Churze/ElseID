const UNSAFE_CHARS = /[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF\u202A-\u202E\u2066-\u2069]/g;
const ANSI_SEQUENCES = /\u001B\[[0-?]*[ -/]*[@-~]/g;

export function sanitizeDisplayText(value: string | null | undefined, maxLength = 500): string {
  const cleaned = (value ?? "")
    .normalize("NFKC")
    .replace(ANSI_SEQUENCES, " ")
    .replace(UNSAFE_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length > maxLength ? cleaned.slice(0, maxLength).trimEnd() : cleaned;
}

export function sanitizeName(value: string | null | undefined, fallback = "Anonymous"): string {
  return sanitizeDisplayText(value, 40) || fallback;
}
