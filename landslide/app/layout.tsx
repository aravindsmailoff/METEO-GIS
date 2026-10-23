import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import 'leaflet/dist/leaflet.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'MeteoGIS — Live Meteorological Intelligence',
  description:
    'A unified GIS platform combining live IMD weather observations, official warnings, satellite imagery, and Doppler radar for India.',
  keywords: [
    'meteorological GIS', 'IMD weather', 'India weather', 'live weather map',
    'AWS stations', 'IMD warnings', 'rainfall map', 'INSAT satellite',
    'convective nowcasting', 'MeteoGIS',
  ],
  authors: [{ name: 'MeteoGIS — SIH 2025 PS 26084' }],
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png',  media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg',             type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'MeteoGIS — Live Meteorological Intelligence',
    description: 'Unified GIS platform for live Indian meteorological data.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: [{ media: '(prefers-color-scheme: dark)', color: '#0d1117' }],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://gibs.earthdata.nasa.gov" crossOrigin="" />
        <link rel="dns-prefetch" href="https://gibs.earthdata.nasa.gov" />
        <link rel="preconnect" href="https://server.arcgisonline.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://server.arcgisonline.com" />
        <link rel="preconnect" href="https://services.arcgisonline.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://services.arcgisonline.com" />
        <link rel="preconnect" href="https://bhuvan-vec1.nrsc.gov.in" crossOrigin="" />
        <link rel="dns-prefetch" href="https://bhuvan-vec1.nrsc.gov.in" />
      </head>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
