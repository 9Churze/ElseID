/**
 * Sanitizes an error message to prevent leaking internal paths or sensitive details.
 */
export declare function sanitizeErrorMessage(err: unknown): string;
