import { NextRequest, NextResponse } from 'next/server';
import { computeLivePhysicalRoadRoute } from '@/lib/localRoadRouter';

export async function POST(req: NextRequest) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const origin = body.origin || { lat: 25.682, lon: 91.924 };
  const destination = body.destination || { lat: 25.578, lon: 91.880 };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const targetUrl = new URL('/api/routing/route', backendUrl);
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err: any) {
    // Backend offline / unreachable: use high-precision physical road router
  }

  const liveRoute = await computeLivePhysicalRoadRoute(origin, destination, 'standard');
  return NextResponse.json(liveRoute);
}

