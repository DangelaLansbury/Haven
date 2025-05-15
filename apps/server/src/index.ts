import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';

interface FormFields {
  sessionId: string;
  data: string;
  grossIncome?: string;
  generalDeductions?: string;
  netIncome?: string;
}

// const sessionData: Record<string, { grossIncome?: string }> = {};
const sessionData: Record<string, Partial<FormFields>> = {};

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, '../../web/dist')));

// receive OCR from mobile, broadcast to desktop
const submitHandler = (req: Request, res: Response): void => {
  // const { sessionId, data, grossIncome } = req.body;
  const { sessionId, data, grossIncome, generalDeductions, netIncome } = req.body as FormFields;
  if (sessionId) {
    io.to(sessionId).emit('ocrResult', data);
    if (grossIncome) {
      sessionData[sessionId] = { grossIncome };
    }
    if (generalDeductions) {
      sessionData[sessionId] = { ...sessionData[sessionId], generalDeductions };
    }
    if (netIncome) {
      sessionData[sessionId] = { ...sessionData[sessionId], netIncome };
    }
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

// fallback to index.html for client‑side routing
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
