import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApp } from './app.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isProd = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT) || 3000;

const app = createApp({ repo: null, config: { port } });

app.use('/api', (req, res) => {
  res.status(404).json({ fel: 'Adressen finns inte.' });
});

if (isProd) {
  const dist = path.join(root, 'dist');
  app.use(express.static(dist));
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(dist, 'index.html'));
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, () => {
  console.log(`Done! körs på http://localhost:${port}`);
});
