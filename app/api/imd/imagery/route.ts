import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Exact byte sizes of IMD's placeholder building photos (Chennai Port & Machilipatnam towers)
const BANNED_PLACEHOLDER_SIZES = new Set([
  164635,   // cni static products (single frame building)
  3115034,  // CNI_MAXZ.gif (19 frames of Chennai Port building)
  119709,   // mpt static products (single frame building)
  2258400,  // MPT_MAXZ.gif (19 frames of Machilipatnam tower)
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'radar';
  const rawStation = searchParams.get('station') || 'delhi';
  const rawProduct = searchParams.get('product') || 'maxz';
  const channel = searchParams.get('channel') || 'ir1';

  try {
    if (type === 'satellite') {
      const validChannels = ['ir1', 'ctbt', 'vis'];
      const ch = validChannels.includes(channel) ? channel : 'ir1';
      const targetUrl = `https://mausam.imd.gov.in/Satellite/3Dasiasec_${ch}.jpg`;

      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) IMD-Nowcast-Ingestion/2.0',
          'Referer': 'https://mausam.imd.gov.in/',
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const buf = await res.arrayBuffer();
        return new NextResponse(buf, {
          status: 200,
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Source': `IMD Official Satellite (${targetUrl})`,
          },
        });
      }
      return NextResponse.json({ error: 'Satellite feed unavailable' }, { status: 502 });
    }

    if (type === 'radar') {
      const stn = rawStation.toLowerCase();
      const prod = rawProduct.toLowerCase();

      // Operational IMD station mapping: routes non-operational or offline radar stations
      // to their authentic active regional Doppler Weather Radar stream
      const REGIONAL_STATION_ROUTING: Record<string, string> = {
        mpt: 'vsk',    // Machilipatnam static photo -> Visakhapatnam S-Band
        coch: 'tvm',   // Kochi -> Thiruvananthapuram S-Band (covers entire Kerala corridor)
        blr: 'goa',    // Bengaluru -> Goa S-Band / South-West radar
        shl: 'agt',    // Shillong/Cherrapunji -> Agartala S-Band (covers North-East)
        sml: 'srn',    // Shimla/Himachal -> Srinagar X-Band (Himalayan / Pir Panjal)
        mkt: 'delhi',  // Mukteshwar/Uttarakhand -> Delhi C-Band (North India)
        pat: 'lkn',    // Patna/Bihar -> Lucknow C-Band (Central Gangetic)
      };

      let effectiveStn = REGIONAL_STATION_ROUTING[stn] || stn;
      let isFallbackStation = effectiveStn !== stn;

      const stationUpper = effectiveStn.toUpperCase();

      // Build ordered candidate list
      const candidateUrls: string[] = [];

      if (prod === 'maxz') {
        candidateUrls.push(
          `https://mausam.imd.gov.in/Radar/animation/Converted/${stationUpper}_MAXZ.gif`,
          `https://mausam.imd.gov.in/Radar/maxz_${effectiveStn}.gif`
        );
      } else {
        candidateUrls.push(
          `https://mausam.imd.gov.in/Radar/${prod}_${effectiveStn}.gif`,
          `https://mausam.imd.gov.in/Radar/animation/Converted/${stationUpper}_MAXZ.gif`
        );
      }

      // Guaranteed authentic operational live fallbacks (Delhi is central HQ)
      candidateUrls.push(
        'https://mausam.imd.gov.in/Radar/animation/Converted/DELHI_MAXZ.gif',
        'https://mausam.imd.gov.in/Radar/animation/Converted/HYD_MAXZ.gif',
        'https://mausam.imd.gov.in/Radar/animation/Converted/MUM_MAXZ.gif',
        'https://mausam.imd.gov.in/Radar/animation/Converted/KOL_MAXZ.gif'
      );

      for (const url of candidateUrls) {
        try {
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) IMD-DWR-Operational/3.0',
              'Referer': 'https://mausam.imd.gov.in/',
            },
            cache: 'no-store', // Always get fresh sweep
          });

          if (res.ok && (res.headers.get('content-type') || '').includes('image')) {
            const buf = await res.arrayBuffer();

            // Strict Filter: Never serve known static building photo placeholders
            if (BANNED_PLACEHOLDER_SIZES.has(buf.byteLength)) {
              continue;
            }

            return new NextResponse(buf, {
              status: 200,
              headers: {
                'Content-Type': 'image/gif',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'X-Source': `IMD Official Doppler Weather Radar (${url})`,
                'X-Radar-Station': effectiveStn,
                'X-Radar-Product': prod,
                'X-Fallback-Active': isFallbackStation ? 'true' : 'false',
              },
            });
          }
        } catch (e) {
          // Continue to next candidate
        }
      }

      return NextResponse.json({ error: 'No live radar feed available' }, { status: 502 });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
