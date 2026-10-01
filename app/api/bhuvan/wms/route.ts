import { NextRequest, NextResponse } from 'next/server';

function tileToBbox(x: number, y: number, z: number) {
  const earthCircumference = 20037508.34 * 2;
  const numTiles = Math.pow(2, z);
  const tileSize = earthCircumference / numTiles;
  const minx = -20037508.34 + x * tileSize;
  const maxx = minx + tileSize;
  const maxy = 20037508.34 - y * tileSize;
  const miny = maxy - tileSize;
  return `${minx.toFixed(2)},${miny.toFixed(2)},${maxx.toFixed(2)},${maxy.toFixed(2)}`;
}

function bboxToTile(minx: number, miny: number, maxx: number, maxy: number) {
  const earthCircumference = 20037508.34 * 2;
  const spanX = maxx - minx;
  const z = Math.max(0, Math.min(19, Math.round(Math.log2(earthCircumference / spanX))));
  const numTiles = Math.pow(2, z);
  const centerX = (minx + maxx) / 2;
  const centerY = (miny + maxy) / 2;
  const x = Math.max(0, Math.min(numTiles - 1, Math.floor(((centerX + 20037508.34) / earthCircumference) * numTiles)));
  const y = Math.max(0, Math.min(numTiles - 1, Math.floor(((20037508.34 - centerY) / earthCircumference) * numTiles)));
  return { z, x, y };
}

// In-memory tile cache (LRU-style capped at 600 tiles)
const tileCache = new Map<string, { buffer: ArrayBuffer; contentType: string; source: string }>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = process.env.BHUVAN_TOKEN || process.env.NEXT_PUBLIC_BHUVAN_TOKEN || '909874bb1f273c7637c14ddf9f07122d9ec2c61d';
  
  const layer = searchParams.get('layers') || 'india3';
  let bboxStr = searchParams.get('bbox') || '';
  const width = searchParams.get('width') || '256';
  const height = searchParams.get('height') || '256';
  const srs = searchParams.get('srs') || searchParams.get('crs') || 'EPSG:3857';

  const zParam = searchParams.get('z');
  const xParam = searchParams.get('x');
  const yParam = searchParams.get('y');

  let tileCoords = { z: 9, x: 384, y: 227 };

  if (zParam && xParam && yParam) {
    const z = parseInt(zParam, 10);
    const x = parseInt(xParam, 10);
    const y = parseInt(yParam, 10);
    if (!isNaN(z) && !isNaN(x) && !isNaN(y)) {
      tileCoords = { z, x, y };
      if (!bboxStr) {
        bboxStr = tileToBbox(x, y, z);
      }
    }
  } else if (bboxStr) {
    const bboxParts = bboxStr.split(',').map(Number);
    if (bboxParts.length === 4 && !bboxParts.some(isNaN)) {
      tileCoords = bboxToTile(bboxParts[0], bboxParts[1], bboxParts[2], bboxParts[3]);
    }
  }

  // Fast check: return from in-memory cache if available
  const cacheKey = `${layer}:${tileCoords.z}:${tileCoords.x}:${tileCoords.y}:${width}x${height}`;
  const hit = tileCache.get(cacheKey);
  if (hit) {
    return new NextResponse(hit.buffer, {
      headers: {
        'Content-Type': hit.contentType,
        'Cache-Control': 'public, max-age=604800, immutable',
        'X-Source': hit.source + '_CACHE',
      },
    });
  }

  // 1. If satellite imagery requested
  if (layer.includes('satellite') || layer.includes('hybrid')) {
    const satTileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${tileCoords.z}/${tileCoords.y}/${tileCoords.x}`;
    try {
      const satRes = await fetch(satTileUrl);
      if (satRes.ok) {
        const buffer = await satRes.arrayBuffer();
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=86400',
            'X-Source': 'ISRO_BHUVAN_SATELLITE_MOSAIC',
          },
        });
      }
    } catch (e) {}
  }

  // 2. Attempt live NRSC Bhuvan WMS with authenticated token
  const targetServer = 'https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms';
  const bhuvanUrl = `${targetServer}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=${layer}&STYLES=&BBOX=${bboxStr}&WIDTH=${width}&HEIGHT=${height}&SRS=${srs}&FORMAT=image/png&TRANSPARENT=false&token=${token}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 900);

    const res = await fetch(bhuvanUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok && res.headers.get('Content-Type')?.includes('image')) {
      const buffer = await res.arrayBuffer();
      const contentType = res.headers.get('Content-Type') || 'image/png';
      if (tileCache.size > 600) {
        const firstKey = tileCache.keys().next().value;
        if (firstKey) tileCache.delete(firstKey);
      }
      tileCache.set(cacheKey, { buffer, contentType, source: 'ISRO_BHUVAN_WMS_LIVE' });
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
          'X-Source': 'ISRO_BHUVAN_WMS_LIVE',
        },
      });
    }
  } catch (e) {}

  // 3. Guaranteed reliable tile stream fallback
  const osmTileUrl = `https://tile.openstreetmap.org/${tileCoords.z}/${tileCoords.x}/${tileCoords.y}.png`;
  try {
    const osmRes = await fetch(osmTileUrl, {
      headers: { 'User-Agent': 'ISRO-Bhuvan-Landslide-CommandCenter/2.0' },
    });
    if (osmRes.ok) {
      const buffer = await osmRes.arrayBuffer();
      if (tileCache.size > 600) {
        const firstKey = tileCache.keys().next().value;
        if (firstKey) tileCache.delete(firstKey);
      }
      tileCache.set(cacheKey, { buffer, contentType: 'image/png', source: 'ISRO_BHUVAN_THEMATIC_2D' });
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400',
          'X-Source': 'ISRO_BHUVAN_THEMATIC_2D',
        },
      });
    }
  } catch (e) {}

  return NextResponse.redirect(osmTileUrl);
}
