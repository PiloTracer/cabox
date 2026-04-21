import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/** Favicon — brand letter on primary gradient (failsafe if /favicon.ico is missing). */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #8B5E3C 0%, #6B4226 100%)',
          color: '#FAF3EB',
          fontSize: 20,
          fontWeight: 700,
          fontFamily: 'Georgia, serif',
          borderRadius: 6,
        }}
      >
        C
      </div>
    ),
    { ...size },
  );
}
