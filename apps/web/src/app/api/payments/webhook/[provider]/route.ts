import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const bodyBuffer = await req.arrayBuffer();

    const apiBase =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/v1\/?$/, '') ||
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/v1\/?$/, '') ||
      'https://api.taqtix.id';

    const targetUrl = `${apiBase}/payments/webhook/${provider}`;

    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'content-length') {
        headers[key] = value;
      }
    });

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: bodyBuffer,
    });

    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error: any) {
    console.error('[Webhook Forwarder Error]:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to forward webhook to backend' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'active', message: 'Webhook listener ready' });
}
