import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import QRCode from 'qrcode.react';
import { createWorker } from 'tesseract.js';

const App = () => {
  const [sessionId, setSessionId] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [ocrText, setOcrText] = useState('');

  useEffect(() => {
    // generate or read sessionId
    let id = new URLSearchParams(window.location.search).get('sessionId');
    if (!id) {
      id = Math.random().toString(36).slice(2);
      window.history.replaceState({}, '', `?sessionId=${id}`);
    }
    setSessionId(id);

    // connect Socket.IO
    const sock = io({ query: { sessionId: id } });
    sock.on('ocrResult', (data: string) => setOcrText(data));
    setSocket(sock);

    return () => sock.disconnect();
  }, []);

  // simple route check
  const isUpload = window.location.pathname.includes('upload');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const worker = createWorker();
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data } = await worker.recognize(file);
    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, data: data.text }),
    });
    await worker.terminate();
  };

  return (
    <div style={{ padding: 20 }}>
      {/* <h1>Hello, world!</h1> */}
      {isUpload ? (
        <>
          <h2>Upload & OCR</h2>
          <input type="file" accept="image/*" capture="environment" onChange={handleFile} />
        </>
      ) : (
        <>
          <h2>Desktop Form</h2>
          <p>Scan this QR code:</p>
          <QRCode value={`${window.location.origin}/upload?sessionId=${sessionId}`} />
          <h3>OCR result:</h3>
          <pre>{ocrText}</pre>
        </>
      )}
    </div>
  );
};

export default App;
