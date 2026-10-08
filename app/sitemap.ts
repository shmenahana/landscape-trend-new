import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/weddings`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/order`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}
