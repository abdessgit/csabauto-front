import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.resolve('public');
const ASSETS_DIR = path.resolve('src/assets');

// 1. Monogram Square SVG (favicon.svg)
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#111111"/>
  <text x="256" y="360" font-family="'Arial Black', Impact, 'Montserrat', sans-serif" font-weight="900" font-size="310" fill="#f5c400" text-anchor="middle" letter-spacing="-6">CS</text>
</svg>`;

// 2. Horizontal Logo SVG (Light background: AUTO is #111111)
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80">
  <g transform="translate(10, 10)">
    <g transform="skewX(-10)">
      <rect x="0" y="0" width="135" height="60" rx="4" fill="#f5c400"/>
      <text x="67" y="43" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="38" fill="#111111" text-anchor="middle">CSAB</text>
    </g>
    <text x="160" y="44" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="40" fill="#111111" letter-spacing="2">AUTO</text>
  </g>
</svg>`;

// 3. Horizontal Logo SVG (Dark background: AUTO is #ffffff)
const logoWhiteSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80">
  <g transform="translate(10, 10)">
    <g transform="skewX(-10)">
      <rect x="0" y="0" width="135" height="60" rx="4" fill="#f5c400"/>
      <text x="67" y="43" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="38" fill="#111111" text-anchor="middle">CSAB</text>
    </g>
    <text x="160" y="44" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="40" fill="#ffffff" letter-spacing="2">AUTO</text>
  </g>
</svg>`;

// 4. Open Graph Image SVG (1200x630)
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
    <linearGradient id="yellowGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffd400"/>
      <stop offset="100%" stop-color="#f5c400"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bgGrad)"/>
  <rect width="1200" height="8" fill="url(#yellowGrad)"/>
  <rect x="40" y="40" width="1120" height="550" rx="16" fill="none" stroke="rgba(255,212,0,0.15)" stroke-width="2"/>

  <g transform="translate(600, 240)">
    <g transform="translate(-210, -55) skewX(-10)">
      <rect x="0" y="0" width="230" height="110" rx="8" fill="url(#yellowGrad)"/>
      <text x="115" y="76" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="70" fill="#000000" text-anchor="middle" letter-spacing="1">CSAB</text>
    </g>
    <text x="50" y="24" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="72" fill="#ffffff" letter-spacing="4">AUTO</text>
  </g>

  <text x="600" y="380" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="28" fill="#e4e4e7" text-anchor="middle" letter-spacing="4">ACHAT • VENTE • REPRISE • ATELIER MÉCANIQUE</text>
  <line x1="450" y1="415" x2="750" y2="415" stroke="rgba(255,212,0,0.4)" stroke-width="2"/>

  <g transform="translate(600, 480)">
    <rect x="-240" y="-24" width="480" height="48" rx="24" fill="rgba(255,212,0,0.1)" stroke="#f5c400" stroke-width="1.5"/>
    <text x="0" y="8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="20" fill="#ffd400" text-anchor="middle" letter-spacing="1.5">MEURCHIN (62)  •  CSABAUTO.FR</text>
  </g>
</svg>`;

// Helper to create multi-resolution ICO (16, 32, 48)
function createIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO format
  header.writeUInt16LE(count, 4); // Number of images

  let currentOffset = 6 + 16 * count;
  const dirEntries = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.buffer.length, 8);
    entry.writeUInt32LE(currentOffset, 12);
    dirEntries.push(entry);
    currentOffset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...images.map(img => img.buffer)]);
}

async function run() {
  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  await fs.mkdir(ASSETS_DIR, { recursive: true });

  console.log('Generating vector files...');
  await fs.writeFile(path.join(PUBLIC_DIR, 'favicon.svg'), faviconSvg, 'utf-8');
  await fs.writeFile(path.join(ASSETS_DIR, 'favicon.svg'), faviconSvg, 'utf-8');
  await fs.writeFile(path.join(ASSETS_DIR, 'logo.svg'), logoSvg, 'utf-8');
  await fs.writeFile(path.join(ASSETS_DIR, 'logo-white.svg'), logoWhiteSvg, 'utf-8');

  console.log('Generating PNG favicons and app icons...');
  const baseImg = sharp(Buffer.from(faviconSvg));

  // Generate PNGs
  const [b16, b32, b48, b96, b180, b192, b512] = await Promise.all([
    baseImg.clone().resize(16, 16).png().toBuffer(),
    baseImg.clone().resize(32, 32).png().toBuffer(),
    baseImg.clone().resize(48, 48).png().toBuffer(),
    baseImg.clone().resize(96, 96).png().toBuffer(),
    baseImg.clone().resize(180, 180).png().toBuffer(),
    baseImg.clone().resize(192, 192).png().toBuffer(),
    baseImg.clone().resize(512, 512).png().toBuffer(),
  ]);

  await fs.writeFile(path.join(PUBLIC_DIR, 'favicon-16x16.png'), b16);
  await fs.writeFile(path.join(PUBLIC_DIR, 'favicon-32x32.png'), b32);
  await fs.writeFile(path.join(PUBLIC_DIR, 'favicon-96x96.png'), b96);
  await fs.writeFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), b180);
  await fs.writeFile(path.join(PUBLIC_DIR, 'icon-192.png'), b192);
  await fs.writeFile(path.join(PUBLIC_DIR, 'icon-512.png'), b512);

  console.log('Generating favicon.ico (16, 32, 48 px)...');
  const icoBuf = createIco([
    { width: 16, height: 16, buffer: b16 },
    { width: 32, height: 32, buffer: b32 },
    { width: 48, height: 48, buffer: b48 },
  ]);
  await fs.writeFile(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuf);

  console.log('Generating og-image.png (1200x630)...');
  const ogBuf = await sharp(Buffer.from(ogSvg)).png().toBuffer();
  await fs.writeFile(path.join(PUBLIC_DIR, 'og-image.png'), ogBuf);

  console.log('Generating site.webmanifest...');
  const manifest = {
    name: 'CS AB AUTO',
    short_name: 'CS AB AUTO',
    description: "Vente de véhicules d'occasion et atelier mécanique à Meurchin",
    start_url: '/',
    display: 'standalone',
    background_color: '#111111',
    theme_color: '#f5c400',
    icons: [
      {
        src: '/favicon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
  await fs.writeFile(
    path.join(PUBLIC_DIR, 'site.webmanifest'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf-8'
  );

  console.log('Generating robots.txt...');
  const robots = 'User-agent: *\nAllow: /\n';
  await fs.writeFile(path.join(PUBLIC_DIR, 'robots.txt'), robots, 'utf-8');

  console.log('All visual identity assets generated successfully!');
}

run().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
