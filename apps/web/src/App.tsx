import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import QRCode from 'qrcode.react';
import { createWorker } from 'tesseract.js';
import loadImage from 'blueimp-load-image';
import styles from './css/Form.module.css';

const App = () => {
  const [sessionId, setSessionId] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [ocrText, setOcrText] = useState('');
  const [grossIncome, setGrossIncome] = useState('');

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
    sock.on('connect', () => console.log('[Socket.IO] connected, id=', sock.id));
    sock.on('ocrResult', (data: string) => {
      console.log('[Socket.IO] ocrResult=', data);
      setOcrText(data);
    });
    setSocket(sock);

    return () => sock.disconnect();
  }, []);

  // simple route check
  const isUpload = window.location.pathname.includes('upload');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // hook into Tesseract progress
    const worker = createWorker({
      logger: (m) => console.log('[Tesseract]', m),
    });

    // load into canvas, fix orientation & downscale
    const canvas: HTMLCanvasElement = await new Promise((resolve, reject) => {
      loadImage(
        file,
        (imgOrCanvas: HTMLImageElement | HTMLCanvasElement) => {
          if (imgOrCanvas instanceof HTMLCanvasElement) resolve(imgOrCanvas);
          else reject(new Error('Could not get canvas'));
        },
        { canvas: true, orientation: true, maxWidth: 1024 }
      );
    });

    console.log('[OCR] loading worker…');
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    console.log('[OCR] recognizing…');
    const { data } = await worker.recognize(canvas);
    console.log('[OCR] final text:', data.text);

    // split into lines and build a map of label → value
    const lines = data.text.split(/\r?\n/);
    const fields: Record<string, string> = {};
    lines.forEach((line) => {
      const match = line.match(/^(.*?)[:\s]\s*(.+)$/);
      if (match) {
        const key = match[1].trim().toLowerCase();
        const value = match[2].trim();
        fields[key] = value;
      }
    });

    // now you can pull out “gross income” (case‐insensitive):
    const grossIncome = fields['gross income'];
    setGrossIncome(grossIncome || 'not found');
    console.log('Extracted gross income:', grossIncome);

    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, data: data.text, grossIncome }),
    });
    console.log('[API] /api/submit status=', res.status);

    await worker.terminate();
  };

  return (
    <div style={{ padding: 20 }}>
      {isUpload ? (
        <>
          <h2 className={styles.formHeader}>Upload & OCR</h2>
          <input type="file" accept="image/*" capture="environment" onChange={handleFile} />
          <pre>{ocrText}</pre>
        </>
      ) : (
        <>
          <h2 className={styles.formHeader}>Desktop Form</h2>
          <p>Scan this QR code:</p>
          <QRCode value={`${window.location.origin}/upload?sessionId=${sessionId}`} />
          <h3>OCR text result:</h3>
          <p>Gross: {grossIncome}</p>
          <pre>{ocrText}</pre>
        </>
      )}
    </div>
  );
};

export default App;
