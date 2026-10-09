import type { SyntheticEvent } from 'react';

export const DEFAULT_MEMBER_PHOTO = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200';

/** Fetch photos separately from directory JSON. v=2 bypasses legacy long-lived cached URLs. */
export function memberPhotoUrl(memberId: string): string {
  return `/api/media?v=2&kind=member-photo&id=${encodeURIComponent(memberId)}`;
}

export function useFallbackMemberPhoto(event: SyntheticEvent<HTMLImageElement>, fallback = DEFAULT_MEMBER_PHOTO) {
  const image = event.currentTarget;
  image.onerror = null;
  image.src = fallback;
}
