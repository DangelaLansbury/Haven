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
import { FormFields } from './types';

const App = () => {
  const [sessionId, setSessionId] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [ocrText, setOcrText] = useState(''); // Not really using this guy, but keeping for debugging
  const [formData, setFormData] = useState<FormFields>({
    revenue: '',
    royalty_rate: '',
    operating_rate: '',
    sublicensor_rate: '',
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
      setFormData((prev) => ({ ...prev, revenue }));
    });
    sock.on('ocrRoyalty', ({ royalty_rate }): void => {
      setFormData((prev) => ({ ...prev, royalty_rate }));
    });
    sock.on('ocrOperating', ({ operating_rate }): void => {
      setFormData((prev) => ({ ...prev, operating_rate }));
    });
    sock.on('ocrSublicensor', ({ sublicensor_rate }): void => {
      setFormData((prev) => ({ ...prev, sublicensor_rate }));
    });
    sock.on('ocrLicensor', ({ licensor_rate }): void => {
      setFormData((prev) => ({ ...prev, licensor_rate }));
    });
    setSocket(sock);

    return () => sock.disconnect();
  }, []);

  const isUpload = window.location.pathname.includes('upload');
  const isDemo = window.location.pathname.includes('demo');

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

    let extractedRevenue = '';
    let extractedRoyaltyRate = '';
    let extractedOperatingRate = '';
    let extractedSublicensorRate = '';
    let extractedLicensorRate = '';

    const normalize = (text: string) => text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    function matchText(lineText: string, keyword: string): string | null {
      if (!normalize(lineText).includes(keyword)) return null;

      const percentMatch = lineText.match(/[\d,.]+%/);
      if (percentMatch) {
        return percentMatch[0];
      }

      const words = lineText.trim().split(/\s+/);
      return words.length > 0 ? words[words.length - 1] : null;
    }

    // // Helper function to check horizontal overlap between two bounding boxes
    // function overlapsX(b1: { x0: number; x1: number }, b2: { x0: number; x1: number }): boolean {
    //   return b1.x1 >= b2.x0 && b2.x1 >= b1.x0;
    // }

    // // Function to find the text value directly below a keyword line within overlapping x-range
    // function findValueBelow(lines: any[], keyword: string): string | null {
    //   const normalize = (text: string) => text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    //   // Find the line containing the keyword
    //   const keywordLine = lines.find((line) => normalize(line.text).includes(keyword));
    //   if (!keywordLine) return null;

    //   const kbbox = keywordLine.bbox;
    //   // Find lines below keyword line with overlapping x-range
    //   const candidates = lines.filter((line) => {
    //     const lbbox = line.bbox;
    //     return lbbox.y0 > kbbox.y1 && overlapsX({ x0: kbbox.x0, x1: kbbox.x1 }, { x0: lbbox.x0, x1: lbbox.x1 });
    //   });

    //   if (candidates.length === 0) return null;

    //   // Return the text of the closest line below
    //   candidates.sort((a, b) => a.bbox.y0 - b.bbox.y0);
    //   return candidates[0].text.trim();
    // }

    // Try box-above-value matching first
    // extractedRevenue = findValueBelow(data.lines, 'revenue') || extractedRevenue;
    // extractedRoyaltyRate = findValueBelow(data.lines, 'royalty') || extractedRoyaltyRate;

    for (const line of data.lines) {
      const lineText = line.text;

      if (normalize(lineText).includes('revenue')) {
        const match = matchText(lineText, 'revenue');
        if (match) {
          extractedRevenue = match;
        }
      }

      if (normalize(lineText).includes('royalty')) {
        const match = matchText(lineText, 'royalty');
        if (match) {
          extractedRoyaltyRate = match;
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
      revenue_rate: extractedRevenue,
      royalty_rate: extractedRoyaltyRate,
      operating_rate: extractedOperatingRate,
      sublicensor_rate: extractedSublicensorRate,
      licensor_rate: extractedLicensorRate,
    }));

    if (socket && socket.connected) {
      socket.emit('ocrRevenue', { sessionId, revenue: extractedRevenue });
      socket.emit('ocrRoyalty', { sessionId, royalty_rate: extractedRoyaltyRate });
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
        revenue: extractedRevenue,
        royalty_rate: extractedRoyaltyRate,
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

      if (json.revenue && json.revenue !== formData.revenue) {
        console.log('[Polling] revenue updated:', json.revenue);
        setFormData((prev) => ({ ...prev, revenue: json.revenue }));
      }
      if (json.royalty_rate && json.royalty_rate !== formData.royalty_rate) {
        console.log('[Polling] royalty_rate updated:', json.royalty_rate);
        setFormData((prev) => ({ ...prev, royalty_rate: json.royalty_rate }));
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
      if (json.revenue || json.royalty_rate || json.operating_rate || json.sublicensor_rate || json.licensor_rate) {
        setOCRReady(true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId, isUpload, OCRReady]);

  const resetFormData = () => {
    setFormData({ revenue: '', royalty_rate: '', operating_rate: '', sublicensor_rate: '', licensor_rate: '' });
  };

  const handleSetScreen = (newScreen: 'manual' | 'ocr' | 'initial') => {
    setScreen(newScreen);
    if (newScreen === 'ocr') {
      setOCRReady(false);
    }
    if (newScreen === 'manual' || newScreen === 'initial') {
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
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100vh' }}>
          <>
            {isDemo ? (
              <>
                <DemoForm />
              </>
            ) : (
              <>
                {screen === 'initial' ? (
                  <>
                    <InitialScreen title="haven" setScreen={handleSetScreen} />
                  </>
                ) : screen === 'manual' ? (
                  <>
                    <TaxForm title={'haven'} description={'Enter your tax info manually.'} formData={formData} setFormData={setFormData} handleBack={handleSetScreen} sessionId={sessionId} />
                  </>
                ) : (
                  <>
                    {!OCRReady ? (
                      <>
                        <button onClick={() => handleSetScreen('initial')}>Back</button>
                        <h1 className={commonStyles.header}>haven</h1>
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
                        <TaxForm title={'haven'} description={'Review your tax details for accuracy'} formData={formData} setFormData={setFormData} />
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </>
        </div>
      )}
    </>
  );
};

export default App;
