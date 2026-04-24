import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Tyren',
    description: 'Tyren AI assistant with streaming chat, web search, and PWA support.',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Tyren',
    },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    themeColor: '#ffffff',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="zh-CN" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var theme = localStorage.getItem('tyren-theme');
                                    if (!theme) theme = 'light';
                                    document.documentElement.setAttribute('data-theme', theme);
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
            </head>
            <body style={{ fontFamily: 'Inter, sans-serif' }}>
                {children}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            if ('serviceWorker' in navigator) {
                                var hostname = window.location.hostname;
                                var isLocalhost =
                                    hostname === 'localhost' ||
                                    hostname === '127.0.0.1' ||
                                    hostname === '::1';

                                if (isLocalhost) {
                                    window.addEventListener('load', function() {
                                        navigator.serviceWorker.getRegistrations().then(function(registrations) {
                                            registrations.forEach(function(registration) {
                                                registration.unregister();
                                            });
                                        });

                                        if ('caches' in window) {
                                            caches.keys().then(function(names) {
                                                names.forEach(function(name) {
                                                    caches.delete(name);
                                                });
                                            });
                                        }
                                    });
                                } else {
                                    window.addEventListener('load', function() {
                                        navigator.serviceWorker.register('/sw.js').then(
                                            function(registration) {
                                                console.log('ServiceWorker registration successful with scope: ', registration.scope);
                                                registration.update();
                                            },
                                            function(err) {
                                                console.log('ServiceWorker registration failed: ', err);
                                            }
                                        );
                                    });

                                    var refreshing = false;
                                    navigator.serviceWorker.addEventListener('controllerchange', function() {
                                        if (refreshing) return;
                                        refreshing = true;
                                        window.location.reload();
                                    });
                                }
                            }
                        `,
                    }}
                />
            </body>
        </html>
    )
}
