const SECRET_PATTERNS = [
  /\b[0-9a-f]{64}\b/gi,
  /(privkey|private[_-]?key|secret)(["'\s:=]+)([^"'\s,}]+)/gi,
];

export function redactSecrets(value: unknown): string {
  const text = value instanceof Error
    ? `${value.name}: ${value.message}\n${value.stack ?? ""}`
    : safeStringify(value);

  return SECRET_PATTERNS.reduce((acc, pattern) => {
    if (pattern.source.startsWith("(privkey")) {
      return acc.replace(pattern, "$1$2[REDACTED]");
    }
    return acc.replace(pattern, "[REDACTED_HEX_64]");
  }, text);
}

function safeStringify(value: unknown): string {
  try {
    return typeof value === "string" ? value : JSON.stringify(value);
  } catch {
    return String(value);
  }
}
