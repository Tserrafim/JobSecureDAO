import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <body className="bg-neumorph-bg min-h-screen">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}