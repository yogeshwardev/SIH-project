import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Decorative campaign/category photography only. Listing images always come
// from the product record. Source credits are in docs/storefront-images.md.
const output = fileURLToPath(new URL('../public/images/storefront/', import.meta.url));
const pexels = (id, width = 900) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}&q=85`;
const assets = [
  ['ceramics-hero-v2.jpg', 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?fit=crop&w=1600&q=85&fm=jpg'],
  ['textiles-v2.jpg', pexels(11604961)],
  ['pottery-v2.jpg', pexels(10923157)],
  ['woodcraft-v2.jpg', pexels(6962802)],
  ['metalcraft-v2.jpg', pexels(14724142)],
  ['basket-v2.jpg', pexels(29315525)],
  ['painting-v2.jpg', pexels(102127)],
  ['artisan-v2.jpg', pexels(2892269, 1200)],
];
await mkdir(output, { recursive: true });
await Promise.all(assets.map(async ([name, url]) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error(`${name}: image download failed (${response.status})`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000) throw new Error(`${name}: empty image`);
  await writeFile(path.join(output, name), bytes);
  console.log(`${name}: ${Math.round(bytes.length / 1024)} KB`);
}));
