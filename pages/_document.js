import { Html, Head, Main, NextScript } from 'next/document';

// Inline script to apply the saved theme before first paint — prevents FOUC
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('ces-theme');
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme','dark');
    } else if (!t && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme','dark');
    }
  } catch(e) {}
})();
`;

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
