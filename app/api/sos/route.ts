import { NextResponse } from 'next/server';

/**
 * Proxy SOS beacon submissions to the FastAPI backend, which persists them in
 * PostGIS and broadcasts a CAP alert. If the backend is unreachable this route
 * returns a deliberate FAILURE — an SOS must never fake success, so the client
 * keeps the beacon active and retries.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { latitude, longitude, accuracy_m, reporter_phone, triggered_at_device } = body;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return NextResponse.json(
      { error: 'latitude and longitude (numbers) are required' },
      { status: 422 }
    );
  }

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${backendUrl}/api/v1/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude, accuracy_m, reporter_phone, triggered_at_device }),
      signal: controller.signal,
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return NextResponse.json({ ...data, delivered: true });
    }
    return NextResponse.json(
      { ...data, delivered: false, error: data.message || 'Backend rejected the beacon' },
      { status: 502 }
    );
  } catch {
    return NextResponse.json(
      {
        delivered: false,
        persisted: false,
        error: 'Emergency server unreachable. Beacon NOT delivered — press SEND SOS again to retry, or call 1077.',
      },
      { status: 503 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
