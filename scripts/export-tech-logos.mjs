/**
 * Export monochrome tech stack logos as 2048×2048 transparent PNGs
 * (#F7F7F7 @ 50% opacity). Uses Simple Icons (CC0) + sharp.
 * Creates tech-logos-png/*.png and tech-logos.zip.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, unlinkSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';
import * as SimpleIcons from 'simple-icons';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'tech-logos-png');
/** #F7F7F7 at 50% opacity */
const RGBA = 'rgba(247,247,247,0.5)';
const SIZE = 2048;

/** Slugs from https://simpleicons.org — export name is si + capitalized slug */
const SLUGS = [
  'nextdotjs',
  'typescript',
  'tailwindcss',
  'supabase',
  'clerk',
  'vercel',
  'postgresql',
  'googlegemini',
];

function slugToExportKey(slug) {
  return 'si' + slug.charAt(0).toUpperCase() + slug.slice(1);
}

/**
 * Use full Simple Icons SVG: replace currentColor, strip fills so root fill/color win,
 * force root dimensions + fill + color.
 */
function prepareRasterSvg(icon) {
  let s = icon.svg
    .replace(/currentColor/gi, RGBA)
    .replace(/\sfill="[^"]*"/gi, '')
    .replace(/\sfill='[^']*'/gi, '');

  s = s.replace(/<svg\b([^>]*)>/i, `<svg width="${SIZE}" height="${SIZE}" fill="${RGBA}" color="${RGBA}"$1>`);

  return s;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const created = [];
  const missing = [];

  for (const slug of SLUGS) {
    const key = slugToExportKey(slug);
    const icon = SimpleIcons[key];

    if (!icon || typeof icon.svg !== 'string') {
      console.warn(`⚠️  Missing or invalid Simple Icons export for slug "${slug}" (tried ${key})`);
      missing.push(slug);
      continue;
    }

    const svg = prepareRasterSvg(icon);
    const outPath = join(OUT_DIR, `${slug}.png`);

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outPath);

    created.push(outPath);
    console.log(`✓ ${slug}.png  (${icon.title})`);
  }

  const zipPath = join(OUT_DIR, 'tech-logos.zip');
  if (existsSync(zipPath)) {
    unlinkSync(zipPath);
  }

  if (created.length === 0) {
    console.error('No PNGs were generated; skipping zip.');
    process.exit(missing.length > 0 ? 1 : 0);
  }

  const basenames = created.map((p) => p.split(/[/\\]/).pop());
  try {
    execFileSync('zip', ['-q', '-j', zipPath, ...basenames], {
      cwd: OUT_DIR,
      stdio: 'inherit',
    });
    console.log(`\n📦 ${zipPath} (${created.length} files)`);
  } catch (e) {
    console.error('Failed to run `zip`. On macOS, zip is available by default.', e);
    process.exit(1);
  }

  if (missing.length > 0) {
    console.warn(`\n⚠️  ${missing.length} slug(s) skipped: ${missing.join(', ')}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
