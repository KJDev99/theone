import Providers from './providers';

export const metadata = {
  title: 'TheOne — marks out of 100, rankings and streaks',
  description:
    'Give every student a mark out of 100, watch the weekly and monthly rankings build themselves, award stars and share progress with parents.',
  applicationName: 'TheOne',
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F5FB' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0E1A' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// Stamps the saved theme on <html> before first paint so a dark-mode user never
// sees a white flash on reload. The colours themselves come from `baseCss`
// below, keyed on the same attribute, so toggling the theme later just swaps
// the attribute — no inline style is left behind to override it.
const themeBootstrap = `
(function(){
  try {
    // Preferences moved to their own key when the app gained Supabase; the
    // old key is still read so an existing install keeps its theme.
    var prefs = localStorage.getItem('ball-system:prefs');
    var theme = prefs ? JSON.parse(prefs).theme : null;
    if (theme !== 'dark' && theme !== 'light') {
      var raw = localStorage.getItem('ball-system:v1');
      theme = raw ? (JSON.parse(raw).settings || {}).theme : null;
    }
    if (theme !== 'dark' && theme !== 'light') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.dataset.theme = theme;
  } catch (e) {}
})();
`;

const baseCss = `
  html { background: #F4F5FB; color-scheme: light; }
  html[data-theme='dark'] { background: #0B0E1A; color-scheme: dark; }
  html[data-theme='light'] { background: #F4F5FB; color-scheme: light; }
`;

export default function RootLayout({ children }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: baseCss }} />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
