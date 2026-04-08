// Audit Log utility — localStorage-based, max 500 entries

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601
  username: string;
  action: string;
  details?: string;
}

const AUDIT_LOG_KEY = "acw_audit_log";
const MAX_ENTRIES = 500;

export function addAuditLog(
  username: string,
  action: string,
  details?: string,
): void {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    const existing: AuditLogEntry[] = raw
      ? (JSON.parse(raw) as AuditLogEntry[])
      : [];
    const entry: AuditLogEntry = {
      id: `${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      timestamp: new Date().toISOString(),
      username,
      action,
      details,
    };
    // Prepend and trim to max
    const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(updated));
  } catch {
    // Silently fail — audit log should never break the app
  }
}

export function getAuditLog(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    return raw ? (JSON.parse(raw) as AuditLogEntry[]) : [];
  } catch {
    return [];
  }
}

export function clearAuditLog(): void {
  localStorage.removeItem(AUDIT_LOG_KEY);
}

export function formatAuditTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString("en-IN")} ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return iso;
  }
}
