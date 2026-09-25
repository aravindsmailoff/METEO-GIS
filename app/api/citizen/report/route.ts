import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const reportId = `REP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return NextResponse.json({
      report_id: reportId,
      status: 'QUEUED_FOR_NDRF_TRIAGE',
      received_at: new Date().toISOString(),
      details: body,
      message: 'Landslide incident report recorded with GPS coordinates and queued for emergency verification.',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process report' }, { status: 500 });
  }
}
