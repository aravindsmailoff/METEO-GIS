import { NextResponse } from 'next/server';

/**
 * Proxy "I am safe" cancellations to the FastAPI backend. Returns honest
 * failure when the backend is unreachable so the client knows the beacon
 * is still considered active server-side.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const reportId = body.report_id;
  if (typeof reportId !== 'string' || !reportId) {
    return NextResponse.json({ error: 'report_id is required' }, { status: 422 });
  }

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const targetUrl = new URL('/api/v1/sos/cancel', backendUrl);
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_id: reportId }),
      signal: controller.signal,
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.persisted) {
      return NextResponse.json({ cancelled: true, report_id: reportId });
    }
    return NextResponse.json(
      { cancelled: false, error: data.status || 'Cancel not confirmed' },
      { status: 502 }
    );
  } catch {
    return NextResponse.json(
      { cancelled: false, error: 'Emergency server unreachable — cancel not confirmed.' },
      { status: 503 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
