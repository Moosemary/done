import express from 'express';

export function createApp({ repo, config } = {}) {
  const app = express();
  app.locals.repo = repo;
  app.locals.config = config;

  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ ok: true });
  });

  return app;
}
