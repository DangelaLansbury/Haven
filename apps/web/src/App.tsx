import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import QRCode from 'qrcode.react';
import { createWorker } from 'tesseract.js';
import loadImage from 'blueimp-load-image';
import '../../web/index.css';
import formStyles from './css/Form.module.css';
import cameraStyles from './css/Camera.module.css';
import FormInput from './components/FormInput';
import TaxForm from './components/TaxForm';

const App = () => {
  const [sessionId, setSessionId] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [ocrText, setOcrText] = useState(''); // Not really using this guy, but keeping for debugging
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [isInitialScreen, setIsInitialScreen] = useState(true);
  const [isManualInput, setIsManualInput] = useState(false);

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
      setOcrText(data);
    });
    sock.on('ocrGrossIncome', ({ grossIncome }) => {
      setFormData((prev) => ({ ...prev, grossIncome }));
    });
    sock.on('ocrGeneralDeductions', ({ generalDeductions }) => {
      setFormData((prev) => ({ ...prev, generalDeductions }));
    });
    sock.on('ocrNetIncome', ({ netIncome }) => {
      setFormData((prev) => ({ ...prev, netIncome }));
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

    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    const { data } = await worker.recognize(canvas);

    const normalize = (text: string) => text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    let extractedGrossIncome = '';
    let extractedGeneralDeductions = '';
    let extractedNetIncome = '';

    for (const line of data.lines) {
      const lineText = line.text;
      if (normalize(lineText).includes('grossincome')) {
        const match = lineText.match(/\$[\d,]+(?:\.\d{2})?/);
        if (match) {
          extractedGrossIncome = match[0];
        }
      }

      if (normalize(lineText).includes('generaldeductions')) {
        const match = lineText.match(/\$[\d,]+(?:\.\d{2})?/);
        if (match) {
          extractedGeneralDeductions = match[0];
        }
      }

      if (normalize(lineText).includes('netincome')) {
        const match = lineText.match(/\$[\d,]+(?:\.\d{2})?/);
        if (match) {
          extractedNetIncome = match[0];
        }
      }
    }

    setFormData((prev) => ({ ...prev, grossIncome: extractedGrossIncome, generalDeductions: extractedGeneralDeductions, netIncome: extractedNetIncome }));

    if (socket && socket.connected) {
      socket.emit('ocrGrossIncome', { sessionId, grossIncome: extractedGrossIncome });
      socket.emit('ocrGeneralDeductions', { sessionId, generalDeductions: extractedGeneralDeductions });
      socket.emit('ocrNetIncome', { sessionId, netIncome: extractedNetIncome });
    } else {
      console.warn('[Socket.IO] socket not ready for gross income emit');
    }

    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        data: data.text,
        grossIncome: extractedGrossIncome,
        generalDeductions: extractedGeneralDeductions,
        netIncome: extractedNetIncome,
      }),
    });
    console.log('[API] /api/submit status=', res.status);

    await worker.terminate();
  };

  useEffect(() => {
    if (isUpload) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/session-data?sessionId=${sessionId}`);
      const json = await res.json();

      if (json.grossIncome && json.grossIncome !== formData.grossIncome) {
        console.log('[Polling] grossIncome updated:', json.grossIncome);
        setFormData((prev) => ({ ...prev, grossIncome: json.grossIncome }));
      }
      if (json.generalDeductions && json.generalDeductions !== formData.generalDeductions) {
        console.log('[Polling] generalDeductions updated:', json.generalDeductions);
        setFormData((prev) => ({ ...prev, generalDeductions: json.generalDeductions }));
      }
      if (json.netIncome && json.netIncome !== formData.netIncome) {
        console.log('[Polling] netIncome updated:', json.netIncome);
        setFormData((prev) => ({ ...prev, netIncome: json.netIncome }));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId, isUpload, formData]);

  function goToManualInput() {
    setIsManualInput(true);
    setIsInitialScreen(false);
  }

  function goToOcr() {
    setIsManualInput(false);
    setIsInitialScreen(false);
  }

  return (
    <div style={{ padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {isUpload ? (
        <>
          <div className={cameraStyles.cameraContainer}>
            <video className={cameraStyles.camera} autoPlay playsInline muted />
          </div>
          <div className={cameraStyles.overlay}>
            <h2 className={formStyles.formHeader}>Upload & OCR</h2>
            <input type="file" accept="image/*" capture="environment" onChange={handleFile} />
            <pre>{ocrText}</pre>
          </div>
        </>
      ) : (
        <>
          {isInitialScreen ? (
            <>
              <h2 className={formStyles.formHeader}>Manual Entry or OCR</h2>
              <div className={formStyles.formTypeSelectionContainer}>
                <div className={formStyles.formTypeSelector} onClick={() => goToManualInput()}>
                  Manual Entry
                </div>
                <div className={formStyles.formTypeSelector} onClick={() => goToOcr()}>
                  Use OCR
                </div>
              </div>
            </>
          ) : isManualInput ? (
            <TaxForm formData={formData} setFormData={setFormData} />
          ) : (
            <div className={formStyles.formContainer}>
              <h2 className={formStyles.formHeader}>Tax Ghost</h2>
              <div className={formStyles.qrSection}>
                Scan this QR code:
                <QRCode value={`${window.location.origin}/upload?sessionId=${sessionId}`} />
              </div>
              <>
                <TaxForm formData={formData} setFormData={setFormData} />
                <h3>OCR text result:</h3>
                <pre>{ocrText}</pre>
              </>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
