import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import QRCode from 'qrcode.react';
import { createWorker } from 'tesseract.js';
import loadImage from 'blueimp-load-image';
import '../../web/index.css';
import formStyles from './css/Form.module.css';
import commonStyles from './css/Common.module.css';
import TaxForm from './components/TaxForm';
import InitialScreen from './components/InitialScreen';
import Camera from './components/Camera';
import DemoForm from './components/DemoForm';

const App = () => {
  const [sessionId, setSessionId] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [ocrText, setOcrText] = useState(''); // Not really using this guy, but keeping for debugging
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [screen, setScreen] = useState<'manual' | 'ocr' | 'initial'>('initial');
  const [OCRReady, setOCRReady] = useState(false);

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
  const isDemo = window.location.pathname.includes('demo');

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

    function matchText(lineText: string, keyword: string): string | null {
      const match = lineText.match(new RegExp(`(?<=\\$)[\\d,]+(?:\\.\\d{2})?`, 'i'));
      if (match && normalize(lineText).includes(keyword)) {
        return match[0];
      }
      return null;
    }

    for (const line of data.lines) {
      const lineText = line.text;
      if (normalize(lineText).includes('grossincome')) {
        const match = matchText(lineText, 'grossincome');
        if (match) {
          extractedGrossIncome = match;
        }
      }

      if (normalize(lineText).includes('generaldeductions')) {
        const match = matchText(lineText, 'generaldeductions');
        if (match) {
          extractedGeneralDeductions = match;
        }
      }

      if (normalize(lineText).includes('netincome')) {
        const match = matchText(lineText, 'netincome');
        if (match) {
          extractedNetIncome = match;
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
    if (screen === 'manual') return;

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
      if (json.grossIncome || json.generalDeductions || json.netIncome) {
        setOCRReady(true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId, isUpload, OCRReady]);

  const handleSetScreen = (newScreen: 'manual' | 'ocr' | 'initial') => {
    setScreen(newScreen);
    if (newScreen === 'ocr') {
      setOCRReady(false);
    }
    if (newScreen === 'manual') {
      setFormData({ grossIncome: '', generalDeductions: '', netIncome: '' });
    }
    if (newScreen === 'initial') {
      setFormData({ grossIncome: '', generalDeductions: '', netIncome: '' });
    }
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {isUpload ? (
        <>
          <Camera onCapture={handleFile} OCRReady={OCRReady} />
        </>
      ) : (
        <>
          {isDemo ? (
            <>
              <DemoForm />
            </>
          ) : (
            <>
              {screen === 'initial' ? (
                <>
                  <InitialScreen title="Haven" setScreen={handleSetScreen} />
                </>
              ) : screen === 'manual' ? (
                <>
                  <TaxForm title={'Haven'} description={'Enter your tax info manually.'} formData={formData} setFormData={setFormData} handleBack={handleSetScreen} sessionId={sessionId} />
                </>
              ) : (
                <>
                  {!OCRReady ? (
                    <>
                      <button onClick={() => handleSetScreen('initial')}>Back</button>
                      <h1 className={commonStyles.header}>Haven</h1>
                      <p className={commonStyles.description}>
                        Take a picture of your tax form.{' '}
                        <a className={formStyles.formLink} href={`{window.location.origin}/demo?sessionId=${sessionId}`} target="_blank">
                          Try the demo
                        </a>
                      </p>
                      <div className={formStyles.qrSection}>
                        Scan this QR code:
                        <QRCode value={`${window.location.origin}/upload?sessionId=${sessionId}`} fgColor={'#4b4447'} bgColor={'#fefcf6'} />
                        <p>Your tax details will appear here when you're done…</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <TaxForm title={'Haven'} description={'Review your tax details for accuracy'} formData={formData} setFormData={setFormData} />
                      <h3>OCR text result:</h3>
                      <pre>{ocrText}</pre>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default App;
