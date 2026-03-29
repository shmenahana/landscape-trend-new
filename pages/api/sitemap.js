// Dynamic sitemap generator for township/city service pages
// Access at /api/sitemap or configure as sitemap.xml via rewrites

const SITE_URL = 'https://filipropmaint.com';

// Township and city service areas to be indexed
const SERVICE_AREAS = [
  'lansdale',
  'north-wales',
  'hatfield',
  'souderton',
  'telford',
  'harleysville',
  'skippack',
  'collegeville',
  'trappe',
  'schwenksville',
  'green-lane',
  'pennsburg',
  'east-greenville',
  'red-hill',
  'perkasie',
  'sellersville',
  'quakertown',
  'doylestown',
  'chalfont',
  'warrington',
  'horsham',
  'ambler',
  'blue-bell',
  'plymouth-meeting',
  'conshohocken',
  'norristown',
  'king-of-prussia',
  'pottstown',
  'limerick',
  'royersford',
  'phoenixville',
  'spring-city',
  'worcester',
  'whitemarsh',
  'montgomery-township',
  'upper-gwynedd',
  'lower-gwynedd',
  'whitpain',
  'towamencin',
  'franconia',
  'salford',
  'lower-salford',
  'upper-salford',
];

const SERVICES = [
  'lawn-care',
  'landscaping',
  'snow-removal',
  'property-maintenance',
  'tree-trimming',
  'mulching',
  'leaf-removal',
  'gutter-cleaning',
  'pressure-washing',
  'spring-cleanup',
  'fall-cleanup',
];

export default function handler(req, res) {
  const now = new Date().toISOString();

  const staticPages = [
    '',
    '/about',
    '/services',
    '/contact',
    '/gallery',
    '/testimonials',
    '/blog',
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Static pages
  for (const page of staticPages) {
    xml += `
  <url>
    <loc>${SITE_URL}${page}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
  }

  // Township/City service area pages
  for (const area of SERVICE_AREAS) {
    xml += `
  <url>
    <loc>${SITE_URL}/areas-we-serve/${area}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;

    // Service + area combination pages
    for (const service of SERVICES) {
      xml += `
  <url>
    <loc>${SITE_URL}/${service}-${area}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }
  }

  xml += `
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.status(200).send(xml);
}
