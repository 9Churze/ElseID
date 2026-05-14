const SECRET_PATTERNS = [
  /(privkey|private[_-]?key|secret)(["'\s:=]+)([^"'\s,}]+)/gi,
];

export function redactSecrets(value: unknown): string {
  const text = value instanceof Error
    ? `${value.name}: ${value.message}\n${value.stack ?? ""}`
    : safeStringify(value);

  return SECRET_PATTERNS.reduce((acc, pattern) => {
    return acc.replace(pattern, "$1$2[REDACTED]");
  }, text);
}

function safeStringify(value: unknown): string {
  try {
    return typeof value === "string" ? value : JSON.stringify(value);
  } catch {
    return String(value);
  }
}
