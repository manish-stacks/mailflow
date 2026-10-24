import { ImageResponse } from 'next/og';

export const alt = 'HoverMail — Every Campaign. One Powerful Platform.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80, background: '#171717', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: '#F32735' }} />
          <div style={{ fontSize: 48, fontWeight: 700, display: 'flex' }}>Hover<span style={{ color: '#F32735' }}>Mail</span></div>
        </div>
        <div style={{ marginTop: 48, fontSize: 72, fontWeight: 700, lineHeight: 1.1, display: 'flex' }}>Every Campaign. One Powerful Platform.</div>
      </div>
    ),
    size,
  );
}
