// python3 -m http.server serves .js/.mjs as text/plain, which breaks
// `<script type="module">` under strict MIME checking — identically on
// both trees, but it means neither can be interaction-tested that way.
// This is a minimal static server with correct MIME types instead.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';

const root = process.argv[3];
const port = Number(process.argv[2]);

const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.webp': 'image/webp',
	'.woff2': 'font/woff2',
	'.ico': 'image/x-icon',
};

createServer(async (req, res) => {
	try {
		let path = decodeURIComponent(req.url.split('?')[0]);
		let full = join(root, path);
		let st = await stat(full).catch(() => null);
		if (st?.isDirectory()) full = join(full, 'index.html');
		const data = await readFile(full);
		res.writeHead(200, { 'Content-Type': TYPES[extname(full)] || 'application/octet-stream' });
		res.end(data);
	} catch {
		res.writeHead(404);
		res.end('Not found');
	}
}).listen(port, () => console.log(`serving ${root} on :${port}`));
