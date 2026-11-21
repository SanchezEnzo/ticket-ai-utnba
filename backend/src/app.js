import express from 'express';

const app = express();

app.use(express.json());

app.get('/salud', (_req, res) => {
  res.json({ estado: 'ok' });
});

export { app };
