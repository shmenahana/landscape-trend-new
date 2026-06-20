import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "The Magnet Parlor — Custom Photo Magnets for Events, Weddings & Markets | Northeast Ohio",
    template: "%s · The Magnet Parlor",
  },
  description:
    "Custom photo magnets made on the spot at farmers markets, weddings, and events across Northeast Ohio. Capture the moment. Keep the memory.",
  applicationName: "The Magnet Parlor",
  openGraph: {
    title: "The Magnet Parlor — Custom Photo Magnets",
    description:
      "Custom photo magnets made on the spot at farmers markets, weddings, and events across Northeast Ohio.",
    url: SITE_URL,
    siteName: "The Magnet Parlor",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Magnet Parlor — Custom Photo Magnets",
    description:
      "Capture the moment. Keep the memory. Custom photo magnets across Northeast Ohio.",
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Josefin+Sans:wght@300;400;600&family=Great+Vibes&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>{children}</body>
    </html>
  );
}
