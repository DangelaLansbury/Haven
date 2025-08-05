import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import { FormFields } from '../../web/src/types';

const sessionData: Record<string, Partial<FormFields>> = {};

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(express.static(path.resolve(__dirname, '../../web/dist')));

const submitHandler = (req: Request, res: Response): void => {
  const { sessionId, data, revenue, royalty_rate } = req.body as FormFields;
  if (!sessionId || !/^[a-z0-9]+$/.test(sessionId)) {
    return res.status(400).json({ status: 'invalid sessionId' });
  }

  if (typeof data !== 'string' || data.length > 5000) {
    return res.status(400).json({ status: 'invalid data payload' });
  }
  if (sessionId) {
    io.to(sessionId).emit('ocrResult', data);
    sessionData[sessionId] = {
      ...sessionData[sessionId],
      revenue,
      royalty_rate,
      // operating_country,
    };
    res.json({ status: 'ok' });
  } else {
    res.status(400).json({ status: 'missing sessionId' });
  }
};

app.post('/api/submit', submitHandler);

app.get('/api/session-data', (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  if (sessionId && sessionData[sessionId]) {
    res.json(sessionData[sessionId]);
  } else {
    res.json({});
  }
});

// fallback
app.get('*', (_, res) => {
  res.sendFile(path.resolve(__dirname, '../../web/dist/index.html'));
});

// WebSocket handshake & room join
io.on('connection', (socket) => {
  const { sessionId } = socket.handshake.query;
  if (typeof sessionId === 'string') {
    socket.join(sessionId);
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
