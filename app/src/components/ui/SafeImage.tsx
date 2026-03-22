'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

/**  
 * Drop-in replacement for next/image that gracefully handles broken URLs.
 * On error, hides the image and optionally shows a placeholder.
 */
export default function SafeImage({ onError, style, ...props }: ImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        style={{
          ...style,
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-border-light, #f0ebe6)',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.2 }}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>
    );
  }

  return (
    <Image
      {...props}
      style={style}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
    />
  );
}
