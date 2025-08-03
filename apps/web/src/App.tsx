import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import QRCode from 'qrcode.react';
import Tesseract, { createWorker } from 'tesseract.js';
import loadImage from 'blueimp-load-image';
import '../../web/index.css';
import formStyles from './css/Form.module.css';
import commonStyles from './css/Common.module.css';
import TaxForm from './components/TaxForm';
import InitialScreen from './components/InitialScreen';
import Camera from './components/Camera';
import Explorer from './components/Explorer';
import { Entities, FormFields } from './types';

const App = () => {
  const [sessionId, setSessionId] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [ocrText, setOcrText] = useState(''); // Not really using this guy, but keeping for debugging
  const [formData, setFormData] = useState<FormFields>({
    revenue: '',
    royalty_rate: '',
    operating_rate: '',
    conduit_rate: '',
    licensor_rate: '',
  });
  const [screen, setScreen] = useState<'manual' | 'ocr' | 'initial'>('initial');
  const [OCRReady, setOCRReady] = useState(false);
  const [fileAdded, setFileAdded] = React.useState(false);

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
    sock.on('ocrRevenue', ({ revenue }): void => {
      setFormData((prev: FormFields) => ({ ...prev, revenue }));
    });
    sock.on('ocrRoyalty', ({ royalty_rate }): void => {
      setFormData((prev: FormFields) => ({ ...prev, royalty_rate }));
    });
    sock.on('ocrOperating', ({ operating_rate }): void => {
      setFormData((prev: FormFields) => ({ ...prev, operating_rate }));
    });
    sock.on('ocrConduit', ({ conduit_rate }): void => {
      setFormData((prev: FormFields) => ({ ...prev, conduit_rate }));
    });
    sock.on('ocrLicensor', ({ licensor_rate }): void => {
      setFormData((prev: FormFields) => ({ ...prev, licensor_rate }));
    });
    setSocket(sock);

    return () => sock.disconnect();
  }, []);

  const isUpload = window.location.pathname.includes('upload');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileAdded(true);

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

    function matchText(lineText: string, keyword: string): string | null {
      if (!normalize(lineText).includes(keyword)) return null;

      const percentMatch = lineText.match(/[\d,.]+%/);
      if (percentMatch) {
        return percentMatch[0].replace(/[^0-9.,]/g, '');
      }

      const words = lineText.trim().split(/\s+/);
      const lastWord = words.length > 0 ? words[words.length - 1] : null;
      return lastWord ? lastWord.replace(/[^0-9.,]/g, '') : null;
    }

    function findTextInline(lines: Tesseract.Line[], keyword: string, formIndex?: string): string | null {
      for (const line of lines) {
        if (normalize(line.text).includes(keyword)) {
          const match = matchText(line.text, keyword) || matchText(line.text, formIndex || '');
          if (match) return match;
        }
      }
      return null;
    }

    const extractedRevenue = findTextInline(data.lines, 'revenue', '1a') || '';
    const extractedRoyaltyRate = findTextInline(data.lines, 'royalties', '1b') || '';
    const extractedOperatingRate = findTextInline(data.lines, Entities.operating.OCRKeyword, Entities.operating.formIndex) || '';
    const extractedConduitRate = findTextInline(data.lines, Entities.conduit.OCRKeyword, Entities.conduit.formIndex) || '';
    const extractedLicensorRate = findTextInline(data.lines, Entities.licensor.OCRKeyword, Entities.licensor.formIndex) || '';

    setFormData((prev: FormFields) => ({
      ...prev,
      revenue_rate: extractedRevenue,
      royalty_rate: extractedRoyaltyRate,
      operating_rate: extractedOperatingRate,
      conduit_rate: extractedConduitRate,
      licensor_rate: extractedLicensorRate,
    }));

    if (socket && socket.connected) {
      socket.emit('ocrRevenue', { sessionId, revenue: extractedRevenue });
      socket.emit('ocrRoyalty', { sessionId, royalty_rate: extractedRoyaltyRate });
      socket.emit('ocrOperating', { sessionId, operating_rate: extractedOperatingRate });
      socket.emit('ocrConduit', { sessionId, conduit_rate: extractedConduitRate });
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
        revenue: extractedRevenue,
        royalty_rate: extractedRoyaltyRate,
        operating_rate: extractedOperatingRate,
        conduit_rate: extractedConduitRate,
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

      if (json.revenue && json.revenue !== formData.revenue) {
        console.log('[Polling] revenue updated:', json.revenue);
        setFormData((prev: FormFields) => ({ ...prev, revenue: json.revenue }));
      }
      if (json.royalty_rate && json.royalty_rate !== formData.royalty_rate) {
        console.log('[Polling] royalty_rate updated:', json.royalty_rate);
        setFormData((prev: FormFields) => ({ ...prev, royalty_rate: json.royalty_rate }));
      }
      if (json.operating_rate && json.operating_rate !== formData.operating_rate) {
        console.log('[Polling] operating_rate updated:', json.operating_rate);
        setFormData((prev: FormFields) => ({ ...prev, operating_rate: json.operating_rate }));
      }
      if (json.conduit_rate && json.conduit_rate !== formData.conduit_rate) {
        console.log('[Polling] conduit_rate updated:', json.conduit_rate);
        setFormData((prev: FormFields) => ({ ...prev, conduit_rate: json.conduit_rate }));
      }
      if (json.licensor_rate && json.licensor_rate !== formData.licensor_rate) {
        console.log('[Polling] licensor_rate updated:', json.licensor_rate);
        setFormData((prev: FormFields) => ({ ...prev, licensor_rate: json.licensor_rate }));
      }
      if (json.revenue || json.royalty_rate || json.operating_rate || json.conduit_rate || json.licensor_rate) {
        setOCRReady(true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId, isUpload, OCRReady]);

  const resetFormData = () => {
    setFormData({ revenue: '', royalty_rate: '', operating_rate: '', conduit_rate: '', licensor_rate: '' });
  };

  const handleSetScreen = (newScreen: 'manual' | 'ocr' | 'initial') => {
    setScreen(newScreen);
    if (newScreen === 'ocr') {
      setOCRReady(false);
    }
    if (newScreen === 'manual') {
      resetFormData();
      setFormData((prev: FormFields) => ({
        ...prev,
        revenue: '100000',
        royalty_rate: '90',
        operating_rate: '12.5',
        conduit_rate: '0.0',
        licensor_rate: '0.0',
      }));
    }
    if (newScreen === 'initial') {
      resetFormData();
    }
  };

  return (
    <>
      <div className={`${commonStyles.appHeader} ${isUpload ? commonStyles.uploadHeader : ''}`}>
        <div className={commonStyles.logoContainer} onClick={() => handleSetScreen('initial')}>
          <img src="/assets/images/HavenBanana.svg" alt="Haven Logo" />
        </div>
      </div>
      {isUpload ? (
        <>
          <Camera onCapture={handleFile} OCRReady={OCRReady} fileAdded={fileAdded} />
        </>
      ) : (
        <>
          {screen === 'initial' ? (
            <>
              <InitialScreen title="haven" setScreen={handleSetScreen} />
            </>
          ) : screen === 'manual' ? (
            <>
              {/* <TaxForm title={'haven'} description={'Enter your tax info manually.'} formData={formData} setFormData={setFormData} handleBack={handleSetScreen} sessionId={sessionId} /> */}
              <Explorer formData={formData} setFormData={setFormData} />
            </>
          ) : (
            <>
              {!OCRReady ? (
                <>
                  {/* <button onClick={() => handleSetScreen('initial')}>Back</button>
                      <h1 className={commonStyles.header}>haven</h1>
                      <p className={commonStyles.description}>Take a picture of your tax form. </p>
                      <div className={formStyles.qrSection}>
                        Scan this QR code:
                        <QRCode value={`${window.location.origin}/upload?sessionId=${sessionId}`} fgColor={'#4b4447'} bgColor={'#fefcf6'} />
                        <p>Your tax details will appear here when you're done…</p>
                      </div> */}
                  <TaxForm title={'haven'} description={'Enter your tax info manually.'} formData={formData} setFormData={setFormData} handleBack={handleSetScreen} sessionId={sessionId} />
                </>
              ) : (
                <>
                  {/* <TaxForm title={'haven'} description={'Review your tax details for accuracy'} formData={formData} setFormData={setFormData} /> */}
                  <Explorer formData={formData} setFormData={setFormData} />
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};

export default App;
