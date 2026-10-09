import React, { useState } from 'react';

interface MemberAvatarProps {
  src?: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
}

/** Shared photo treatment; missing or unavailable photos show an animated illustration. */
export function MemberAvatar({ src, alt, className = '', loading }: MemberAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const photo = src?.trim();
  if (photo && photo !== failedSrc) {
    return <img src={photo} alt={alt} loading={loading} className={className} onError={() => setFailedSrc(photo)} />;
  }
  return (
    <span role="img" aria-label={`${alt} — profile placeholder`} className={`member-avatar ${className}`}>
      <span className="member-avatar__halo" aria-hidden="true" />
      <span className="member-avatar__figure" aria-hidden="true">
        <svg viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="35" r="15" fill="#ecf7d9" />
          <path d="M19 88c0-21 12-32 31-32s31 11 31 32" fill="#b8d9a8" />
          <path d="M33 60c5 7 11 10 17 10s12-3 17-10" stroke="#ecf7d9" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="member-avatar__spark member-avatar__spark--one" aria-hidden="true">✦</span>
      <span className="member-avatar__spark member-avatar__spark--two" aria-hidden="true">✦</span>
    </span>
  );
}
