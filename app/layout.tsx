import type { Metadata, Viewport } from 'next';
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import { PwaRegister } from '@/components/pwa-register';

export const metadata: Metadata = { title: 'Vexlo — Money without borders', description: 'A simpler way to move money across borders.', manifest: '/manifest.webmanifest' };
export const viewport: Viewport = { themeColor: '#000000' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<PwaRegister /></body></html>;
}
