import express from 'express';
import { clients } from '../emitter.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Ping klienta zaraz po podłączeniu, by wymusić wysłanie nagłówków
  res.write('event: ping\ndata: connected\n\n');

  clients.push(res);

  req.on('close', () => {
    const index = clients.indexOf(res);
    if (index !== -1) {
      clients.splice(index, 1);
    }
  });
});

export default router;
