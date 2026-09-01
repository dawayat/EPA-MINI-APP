import type { SyntheticEvent } from 'react';

export const DEFAULT_MEMBER_PHOTO = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200';

/** A member image is fetched separately from, and cached longer than, directory JSON. */
export function memberPhotoUrl(memberId: string): string {
  return `/api/media?kind=member-photo&id=${encodeURIComponent(memberId)}`;
}

export function useFallbackMemberPhoto(event: SyntheticEvent<HTMLImageElement>, fallback = DEFAULT_MEMBER_PHOTO) {
  const image = event.currentTarget;
  image.onerror = null;
  image.src = fallback;
}
