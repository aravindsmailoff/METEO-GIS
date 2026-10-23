import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'RainMap — Citizen Flood Intelligence',
  description:
    'Real-time flood alerts, dam status, rainfall predictions, infrastructure impact, and SOS emergency reporting for citizens.',
  keywords: [
    'flood alert', 'rain map', 'dam status', 'IMD warnings', 'SOS emergency',
    'Sikkim flood', 'Teesta dam', 'citizen disaster app', 'flood evacuation',
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#060d18',
};

export default function RainMapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
