const DEFAULT_PLATFORM_ADMIN_EMAILS = ["imgumx@gmail.com"] as const;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getPlatformAdminEmails(): string[] {
  const raw = process.env.OPENGRAZE_PLATFORM_ADMIN_EMAILS?.trim();
  if (!raw) return [...DEFAULT_PLATFORM_ADMIN_EMAILS];
  return raw
    .split(",")
    .map((v) => normalizeEmail(v))
    .filter(Boolean);
}

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  return getPlatformAdminEmails().includes(normalized);
}
