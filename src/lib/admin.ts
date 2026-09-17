const ADMIN_SESSION_KEY = 'epa-admin-session';

type StoredAdminSession = { token: string; expiresAt: number };

function readSession(): StoredAdminSession | null {
  try {
    const value = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!value) return null;
    const session = JSON.parse(value) as StoredAdminSession;
    if (!session.token || !Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function hasAdminSession(): boolean {
  return Boolean(readSession());
}

export function adminHeaders(): Record<string, string> {
  const session = readSession();
  return session ? { Authorization: `Bearer ${session.token}` } : {};
}

export function clearAdminSession() {
  try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch { /* unavailable storage */ }
}

export async function signInAdmin(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'admin-login', username, password })
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success || !result?.session?.token) {
      return { success: false, error: result?.error || 'Admin sign-in failed.' };
    }
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(result.session));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Admin sign-in failed.' };
  }
}
