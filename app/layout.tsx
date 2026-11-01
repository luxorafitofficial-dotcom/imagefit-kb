import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ImageFit KB — Compress Images to Your Exact KB Size',
  description:
    'Reduce image file size to meet strict upload requirements. Real browser-based image compression engine with target KB validation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FDFDFE] flex flex-col">{children}</body>
    </html>
  );
}

