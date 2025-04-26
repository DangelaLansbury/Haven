// import express, { Request, Response, NextFunction } from 'express';
// import http from 'http';
// import { Server } from 'socket.io';
// import path from 'path';
// import cors from 'cors';
// import bodyParser from 'body-parser';

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: '*' } });

// app.use(cors());
// app.use(bodyParser.json());

// // serve static frontend
// app.use(express.static(path.resolve(__dirname, '../../client/dist')));

// // receive OCR from mobile, broadcast to desktop
// app.post('/api/submit', (req, res, next) => {
//   const { sessionId, data } = req.body;
//   if (sessionId) {
//     io.to(sessionId).emit('ocrResult', data);
//     return res.json({ status: 'ok' });
//   }
//   res.status(400).json({ status: 'missing sessionId' });
// });

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, '../../web/dist')));

// receive OCR from mobile, broadcast to desktop
const submitHandler = (req: Request, res: Response): void => {
  const { sessionId, data } = req.body;
  if (sessionId) {
    io.to(sessionId).emit('ocrResult', data);
    res.json({ status: 'ok' }); // ← no `return`
  } else {
    res.status(400).json({ status: 'missing sessionId' });
  }
};

app.post('/api/submit', submitHandler);

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
