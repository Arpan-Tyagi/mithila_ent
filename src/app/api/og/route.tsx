import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Premium Cotton & Linen';
    const category = searchParams.get('category') || 'Mithila Enterprises';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F7F4E9', // unbleached-cotton
            border: '20px solid #8B2E2E', // madder-red
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '10px solid #2A2A2A', // charcoal-ink
              padding: '60px',
              backgroundColor: '#ffffff',
            }}
          >
            <h2
              style={{
                fontSize: 40,
                color: '#D4A32A', // turmeric
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: 20,
              }}
            >
              {category}
            </h2>
            <h1
              style={{
                fontSize: 80,
                color: '#2A2A2A', // charcoal-ink
                fontWeight: 900,
                textAlign: 'center',
                maxWidth: '900px',
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response('Failed to generate image', { status: 500 });
  }
}
