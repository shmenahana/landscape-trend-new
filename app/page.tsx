import type { Metadata } from "next";
import Link from "next/link";
import HomeClient from "./HomeClient";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "The Magnet Parlor — Custom Photo Magnets for Events, Weddings & Markets | Northeast Ohio",
  description:
    "Custom photo magnets made on the spot at farmers markets, weddings, and events across Northeast Ohio. Capture the moment. Keep the memory.",
  alternates: { canonical: SITE_URL + "/" },
  openGraph: {
    title: "The Magnet Parlor — Custom Photo Magnets",
    description:
      "Custom photo magnets made on the spot at farmers markets, weddings, and events across Northeast Ohio.",
    url: SITE_URL + "/",
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
};

export default function HomePage() {
  return <HomeClient />;
}
