import { spawn } from 'child_process';
import { mkdir, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = join(__dirname, 'temporary screenshots');
const BASE_URL = process.argv[2] || 'http://localhost:3004';
const LABEL = process.argv[3] || '';

await mkdir(OUT_DIR, { recursive: true });

const files = await readdir(OUT_DIR).catch(() => []);
const nums = files.map((file) => parseInt(file.match(/screenshot-(\d+)/)?.[1], 10)).filter((n) => !Number.isNaN(n));
const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
const name = `screenshot-${next}${LABEL ? '-' + LABEL : ''}.png`;
const outPath = join(OUT_DIR, name);

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  '--window-size=1440,900',
  `--screenshot=${outPath}`,
  BASE_URL,
], { stdio: 'inherit' });

const code = await new Promise((resolve) => chrome.on('close', resolve));

if (code !== 0) {
  throw new Error(`Chrome screenshot failed with exit code ${code}`);
}

console.log(`Screenshot saved: ${name}`);

