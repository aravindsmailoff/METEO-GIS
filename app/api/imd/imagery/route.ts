import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'radar';
  const station = searchParams.get('station') || 'cni';
  const product = searchParams.get('product') || 'ppz'; // ppz, sri, ppv, caz
  const channel = searchParams.get('channel') || 'ir1'; // ir1, ctbt, vis

  try {
    let targetUrl = '';
    let contentType = 'image/gif';

    if (type === 'radar') {
      const validProducts = ['ppz', 'sri', 'ppv', 'caz', 'pac'];
      const prod = validProducts.includes(product) ? product : 'ppz';
      targetUrl = `https://mausam.imd.gov.in/Radar/${prod}_${station.toLowerCase()}.gif`;
      contentType = 'image/gif';
    } else if (type === 'satellite') {
      const validChannels = ['ir1', 'ctbt', 'vis'];
      const ch = validChannels.includes(channel) ? channel : 'ir1';
      targetUrl = `https://mausam.imd.gov.in/Satellite/3Dasiasec_${ch}.jpg`;
      contentType = 'image/jpeg';
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) IMD-Nowcast-Ingestion/2.0',
        'Referer': 'https://mausam.imd.gov.in/',
      },
      next: { revalidate: 300 }, // 5 min cache
    });

    if (!upstreamRes.ok) {
      // Fallback for stations that might use full name or default to cni
      if (type === 'radar' && station !== 'cni') {
        const fallbackRes = await fetch(`https://mausam.imd.gov.in/Radar/${product}_cni.gif`, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://mausam.imd.gov.in/' },
        });
        if (fallbackRes.ok) {
          const buf = await fallbackRes.arrayBuffer();
          return new NextResponse(buf, {
            status: 200,
            headers: {
              'Content-Type': 'image/gif',
              'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
              'X-Source': 'IMD Mausam Radar (Chennai Fallback)',
            },
          });
        }
      }
      return NextResponse.json({ error: `Upstream error: ${upstreamRes.status}` }, { status: upstreamRes.status });
    }

    const imageBuffer = await upstreamRes.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        'X-Source': `IMD Official Stream (${targetUrl})`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
