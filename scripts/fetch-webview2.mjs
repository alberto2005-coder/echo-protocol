/**
 * Fetches the official Microsoft WebView2 Evergreen Bootstrapper into
 * `installer/` when it is missing.
 *
 * The bootstrapper (~1.8 MB) is a Microsoft redistributable, so it is NOT
 * committed to the repository; `npm run installer` calls this script first so
 * a fresh clone can still produce the Inno Setup package.
 *
 * URL (Microsoft download portal):
 *   https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution
 */
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const BOOTSTRAPPER_URL = 'https://go.microsoft.com/fwlink/p/?LinkId=2124703';
const target = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'installer',
  'MicrosoftEdgeWebview2Setup.exe',
);

// Guard: a real bootstrapper is ~1.8 MB; anything smaller is an error page.
const MIN_BYTES = 100_000;

if (existsSync(target)) {
  console.log(`[fetch-webview2] already present: ${target}`);
  process.exit(0);
}

console.log(`[fetch-webview2] downloading ${BOOTSTRAPPER_URL}`);
const response = await fetch(BOOTSTRAPPER_URL, {redirect: 'follow'});
if (!response.ok) {
  throw new Error(`download failed: HTTP ${response.status} ${response.statusText}`);
}

const bytes = Buffer.from(await response.arrayBuffer());
if (bytes.length < MIN_BYTES) {
  throw new Error(`suspicious download: only ${bytes.length} bytes`);
}

mkdirSync(dirname(target), {recursive: true});
writeFileSync(target, bytes);
console.log(
  `[fetch-webview2] saved ${(bytes.length / 1024).toFixed(0)} KB → ${target}`,
);
