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
    sock.on('ocrGrossIncome', ({ grossIncome }) => {
      console.log('[Socket.IO] received gross income:', grossIncome);
      setGrossIncome(grossIncome);
    });
    setSocket(sock);

    return () => sock.disconnect();
  }, []);

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
    console.log(
      '[OCR DEBUG] lines detected:',
      data.lines.map((l) => l.text)
    );

    const normalize = (text: string) => text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    let extractedGrossIncome = '';

    for (const line of data.lines) {
      const lineText = line.text;
      console.log('[OCR DEBUG] line:', lineText);

      if (normalize(lineText).includes('grossincome')) {
        console.log('[OCR MATCH] matched line:', lineText);

        const match = lineText.match(/\$[\d,]+(?:\.\d{2})?/);
        if (match) {
          extractedGrossIncome = match[0];
          console.log('[OCR] gross income (regex):', extractedGrossIncome);
        }
      }
    }

    setGrossIncome(extractedGrossIncome);

    if (socket && socket.connected) {
      console.log('[Socket.IO] emitting gross income:', extractedGrossIncome);
      socket.emit('ocrGrossIncome', { sessionId, grossIncome: extractedGrossIncome });
    } else {
      console.warn('[Socket.IO] socket not ready for gross income emit');
    }

    console.log('[OCR] final text:', data.text);
    console.log('[OCR] submitting grossIncome:', extractedGrossIncome);

    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, data: data.text, grossIncome: extractedGrossIncome }),
    });
    console.log('[API] /api/submit status=', res.status);

    await worker.terminate();
  };

  useEffect(() => {
    if (isUpload) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/session-data?sessionId=${sessionId}`);
      const json = await res.json();

      if (json.grossIncome && json.grossIncome !== grossIncome) {
        console.log('[Polling] grossIncome updated:', json.grossIncome);
        setGrossIncome(json.grossIncome);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId, isUpload, grossIncome]);

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
          <p>
            <strong>Gross Income:</strong>
          </p>
          <input type="text" value={grossIncome} onChange={(e) => setGrossIncome(e.target.value)} placeholder="Gross Income" className={styles.formInput} />
          <pre>{ocrText}</pre>
        </>
      )}
    </div>
  );
};

export default App;
