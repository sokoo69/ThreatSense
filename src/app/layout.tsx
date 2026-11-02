import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ThreatSense Live — Real-Time Affective Masking & Bengali Lip Reading',
  description:
    'In-browser real-time dual-stream threat prediction dashboard featuring facial emotion recognition, Bengali lip-reading (LipBengal), and cross-modal affective masking detection.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen bg-[#0e0e0f] text-[#ededee] antialiased selection:bg-[#5b5bd6]/30 selection:text-[#a5a5f5]">
        {children}
      </body>
    </html>
  );
}
