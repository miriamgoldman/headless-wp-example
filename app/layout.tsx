import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteSettings } from '@/lib/wordpress/queries';
import './globals.css';

const CURRENT_YEAR = 2026;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSiteSettings();

    return {
      title: {
        default: settings?.title || 'WordPress Headless',
        template: `%s | ${settings?.title || 'WordPress Headless'}`,
      },
      description: settings?.description || 'A headless WordPress site built with Next.js',
    };
  } catch (error) {
    console.warn('[Layout] WordPress unavailable during build, using fallback metadata');
    return {
      title: {
        default: 'WordPress Headless',
        template: '%s | WordPress Headless',
      },
      description: 'A headless WordPress site built with Next.js',
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let settings;
  try {
    settings = await getSiteSettings();
  } catch (error) {
    console.warn('[Layout] WordPress unavailable during build, using fallback settings');
    settings = null;
  }

  return (
    <html lang={settings?.language || 'en'}>
      <body className="antialiased">
        <div className="min-h-screen flex flex-col">
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div className="flex items-center">
                  <Link href="/" className="text-2xl font-bold text-gray-900">
                    {settings?.title || 'WordPress Headless'}
                  </Link>
                </div>
                <nav className="flex space-x-8">
                  <Link
                    href="/"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    Home
                  </Link>
                  <Link
                    href="/blog"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    Blog
                  </Link>
                </nav>
              </div>
            </div>
          </header>

          <main className="flex-grow">{children}</main>

          <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <p className="text-center text-gray-600 text-sm">
                &copy; {CURRENT_YEAR} {settings?.title || 'WordPress Headless'}. All
                rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
