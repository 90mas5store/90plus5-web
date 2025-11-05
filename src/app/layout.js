import "./globals.css";
import Head from "next/head";

export const metadata = {
  title: "90+5 Store",
  description: "Donde el tiempo se rompe.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <Head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,301,400,401,500,501,700,701,900,901&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="bg-black text-white font-[Satoshi] antialiased">
        {children}
      </body>
    </html>
  );
}
