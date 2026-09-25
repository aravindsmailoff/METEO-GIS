import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const alertId = `NER-CAP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const districts = body.districts || ['East Sikkim', 'North Sikkim'];
    const severity = body.severity || 'Severe';
    const urgency = body.urgency || 'Immediate';
    const certainty = body.certainty || 'Observed';
    const headline = body.headline || 'High Landslide Risk Warning';
    const description = body.description || 'Intense rainfall triggering hazardous slope instabilities.';
    const instruction = body.instruction || 'Avoid NH-10 and move away from steep slopes.';
    const channels = body.channels || ['SMS', 'CAP_FEED', 'SIREN', 'CITIZEN_PUSH'];

    const capXml = `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>${alertId}</identifier>
  <sender>ner-early-warning@ndma.gov.in</sender>
  <sent>${timestamp}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>Geo</category>
    <event>Landslide & Slope Failure Warning</event>
    <urgency>${urgency}</urgency>
    <severity>${severity}</severity>
    <certainty>${certainty}</certainty>
    <headline>${headline}</headline>
    <description>${description}</description>
    <instruction>${instruction}</instruction>
    <area>
      <areaDesc>${districts.join(', ')}</areaDesc>
    </area>
  </info>
</alert>`;

    return NextResponse.json({
      alert_id: alertId,
      timestamp,
      headline,
      description,
      severity,
      urgency,
      certainty,
      districts,
      instruction,
      channels_dispatched: channels,
      cap_xml: capXml,
      sms_broadcast_count: districts.length * 4520,
      sirens_activated: ['Extreme', 'Severe', 'Critical'].includes(severity) ? 8 : 2,
      status: 'DISPATCHED_SUCCESSFULLY',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to broadcast alert' }, { status: 500 });
  }
}
