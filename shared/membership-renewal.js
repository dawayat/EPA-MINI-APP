// Preserve remaining membership time and clamp leap-day anniversaries.
export function renewalExpiry(currentExpiry, now = new Date()) {
  const current = new Date(currentExpiry || 0);
  const base = current > now ? current : now;
  const result = new Date(base);
  const month = result.getUTCMonth();
  result.setUTCFullYear(result.getUTCFullYear() + 1);
  if (result.getUTCMonth() !== month) result.setUTCDate(0);
  return result.toISOString();
}
