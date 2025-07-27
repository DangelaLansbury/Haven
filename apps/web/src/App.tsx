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
import { FormFields } from '../types';

const App = () => {
  const [sessionId, setSessionId] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [ocrText, setOcrText] = useState(''); // Not really using this guy, but keeping for debugging
  const [formData, setFormData] = useState<FormFields>({
    parent_rate: '',
    operating_rate: '',
    sublicensor_rate: '',
    licensor_rate: '',
  });
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
    sock.on('ocrParent', ({ parent_rate }) => {
      setFormData((prev) => ({ ...prev, parent_rate }));
    });
    sock.on('ocrOperating', ({ operating_rate }) => {
      setFormData((prev) => ({ ...prev, operating_rate }));
    });
    sock.on('ocrSublicensor', ({ sublicensor_rate }) => {
      setFormData((prev) => ({ ...prev, sublicensor_rate }));
    });
    sock.on('ocrLicensor', ({ licensor_rate }) => {
      setFormData((prev) => ({ ...prev, licensor_rate }));
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

    let extractedParentRate = '';
    let extractedOperatingRate = '';
    let extractedSublicensorRate = '';
    let extractedLicensorRate = '';

    function matchText(lineText: string, keyword: string): string | null {
      if (!normalize(lineText).includes(keyword)) return null;

      const percentMatch = lineText.match(/[\d,.]+%/);
      if (percentMatch) {
        return percentMatch[0];
      }

      const words = lineText.trim().split(/\s+/);
      return words.length > 0 ? words[words.length - 1] : null;
    }

    for (const line of data.lines) {
      const lineText = line.text;

      if (normalize(lineText).includes('parent')) {
        const match = matchText(lineText, 'parent');
        if (match) {
          extractedParentRate = match;
        }
      }

      if (normalize(lineText).includes('operating')) {
        const match = matchText(lineText, 'operating');
        if (match) {
          extractedOperatingRate = match;
        }
      }

      if (normalize(lineText).includes('sublicensor')) {
        const match = matchText(lineText, 'sublicensor');
        if (match) {
          extractedSublicensorRate = match;
        }
      }

      if (normalize(lineText).includes('licensor')) {
        const match = matchText(lineText, 'licensor');
        if (match) {
          extractedLicensorRate = match;
        }
      }
    }

    setFormData((prev) => ({
      ...prev,
      parent_rate: extractedParentRate,
      operating_rate: extractedOperatingRate,
      sublicensor_rate: extractedSublicensorRate,
      licensor_rate: extractedLicensorRate,
    }));

    if (socket && socket.connected) {
      socket.emit('ocrParent', { sessionId, parent_rate: extractedParentRate });
      socket.emit('ocrOperating', { sessionId, operating_rate: extractedOperatingRate });
      socket.emit('ocrSublicensor', { sessionId, sublicensor_rate: extractedSublicensorRate });
      socket.emit('ocrLicensor', { sessionId, licensor_rate: extractedLicensorRate });
    } else {
      console.warn('[Socket.IO] socket not ready for gross income emit');
    }

    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        data: data.text,
        parent_rate: extractedParentRate,
        operating_rate: extractedOperatingRate,
        sublicensor_rate: extractedSublicensorRate,
        licensor_rate: extractedLicensorRate,
      }),
    });
    console.log('[API] /api/submit status=', res.status);
    console.log('ocrText:', data.text);

    await worker.terminate();
  };

  useEffect(() => {
    if (screen === 'manual') return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/session-data?sessionId=${sessionId}`);
      const json = await res.json();

      if (!json) return;

      if (json.parent_rate && json.parent_rate !== formData.parent_rate) {
        console.log('[Polling] parent_rate updated:', json.parent_rate);
        setFormData((prev) => ({ ...prev, parent_rate: json.parent_rate }));
      }
      if (json.operating_rate && json.operating_rate !== formData.operating_rate) {
        console.log('[Polling] operating_rate updated:', json.operating_rate);
        setFormData((prev) => ({ ...prev, operating_rate: json.operating_rate }));
      }
      if (json.sublicensor_rate && json.sublicensor_rate !== formData.sublicensor_rate) {
        console.log('[Polling] sublicensor_rate updated:', json.sublicensor_rate);
        setFormData((prev) => ({ ...prev, sublicensor_rate: json.sublicensor_rate }));
      }
      if (json.licensor_rate && json.licensor_rate !== formData.licensor_rate) {
        console.log('[Polling] licensor_rate updated:', json.licensor_rate);
        setFormData((prev) => ({ ...prev, licensor_rate: json.licensor_rate }));
      }
      if (json.parent_rate || json.operating_rate || json.sublicensor_rate || json.licensor_rate) {
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
      // setFormData({ grossIncome: '', generalDeductions: '', netIncome: '' });
      setFormData({ parent_rate: '', operating_rate: '', sublicensor_rate: '', licensor_rate: '' });
    }
    if (newScreen === 'initial') {
      // setFormData({ grossIncome: '', generalDeductions: '', netIncome: '' });
      setFormData({ parent_rate: '', operating_rate: '', sublicensor_rate: '', licensor_rate: '' });
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
