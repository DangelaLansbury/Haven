import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Tesseract, { createWorker } from 'tesseract.js';
import loadImage from 'blueimp-load-image';
import '../../web/index.css';
import commonStyles from './css/Common.module.css';
import TaxForm from './components/TaxForm';
import WelcomeScreen from './components/Welcome';
import Camera from './components/Camera';
import Explorer from './components/Explorer';
import { FormFields, DefaultMockData, CountryNames, BlendingResult, DefaultFormFields, DollarValue } from './types';
import { formatDollars, makeDefaultBlend, matchToCountryEnum } from './utils';
import { extractBelow, extractTextColumnBelow } from './ocrHelpers';
import * as fuzz from 'fuzzball';

const App = () => {
  const [sessionId, setSessionId] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [ocrText, setOcrText] = useState(''); // Not really using this guy, but keeping for debugging
  const [formData, setFormData] = useState<FormFields>({ ...DefaultMockData });
  const [screen, setScreen] = useState<'manual' | 'ocr' | 'initial'>('initial');
  const [OCRReady, setOCRReady] = useState(false);
  const [fileAdded, setFileAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultBlend = makeDefaultBlend();
  const [blend, setBlend] = useState<BlendingResult>(defaultBlend);
  const [optLevel, setOptLevel] = useState<'optimal' | 'inefficient' | 'topup' | 'none'>('optimal');

  useEffect(() => {
    // generate or read sessionId
    let id = new URLSearchParams(window.location.search).get('sessionId');
    if (!id) {
      id = Math.random().toString(36).slice(2);
      window.history.replaceState({}, '', `?sessionId=${id}`);
    }
    setSessionId(id);

    // connect Socket.IO
    const sock = io({
      query: { sessionId: id },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 3000,
    });
    sock.on('connect', () => console.log('[Socket.IO] connected, id=', sock.id));
    sock.on('ocrResult', (data: string) => {
      setOcrText(data);
    });
    sock.on('ocrRevenue', ({ revenue }): void => {
      setFormData((prev: FormFields) => ({ ...prev, revenue }));
    });
    sock.on('ocrCountries', ({ countries }): void => {
      setFormData((prev: FormFields) => ({ ...prev, countries }));
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
    let worker: ReturnType<typeof createWorker> | null = null;
    try {
      worker = createWorker({ logger: (m) => console.log('[Tesseract]', m) });

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

      console.table(data.lines.map((l) => ({ t: l.text, y0: l.bbox.y0, y1: l.bbox.y1 })));
      console.table(data.words.map((w) => ({ t: w.text, x0: w.bbox.x0, x1: w.bbox.x1, y0: w.bbox.y0, y1: w.bbox.y1 })));

      const extractedRevenue = extractBelow(data.words, 'income', { xPad: 16, minXOverlap: 0.25 });

      // const extractedForeignTaxRate = extractBelow(data.words, 'foreign', { xPad: 16, minXOverlap: 0.25 });

      const extractedCountries = extractTextColumnBelow(data.words, ['country', 'countries'], {
        stopWords: ['total', 'notes'],
        xPad: 20,
        minXOverlap: 0.2,
      });

      const cleanedCountries = extractedCountries.map((c) => matchToCountryEnum(c)).filter((c): c is CountryNames => c !== null);

      setFormData((prev: FormFields) => ({
        ...prev,
        revenue: extractedRevenue,
        countries: cleanedCountries,
      }));

      if (socket && socket.connected) {
        socket.emit('ocrRevenue', { sessionId, revenue: extractedRevenue });
        socket.emit('ocrCountries', { sessionId, countries: cleanedCountries });
      } else {
        console.warn('[Socket.IO] socket not ready for emit');
      }

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          data: data.text,
          revenue: extractedRevenue,
          countries: cleanedCountries,
        }),
      });
      console.log('[API] /api/submit status=', res.status);
      console.log('ocrText:', data.text);

      await worker.terminate();
    } catch (err) {
      console.error('[OCR] failed:', err);
      setError('Something went wrong. Please try again. If the problem persists, try refreshing the page.');
    } finally {
      if (worker) {
        try {
          await (await worker).terminate();
        } catch {}
      }
    }
  };

  useEffect(() => {
    if (screen === 'manual') return;

    let pollingActive = true;

    const interval = setInterval(async () => {
      if (!pollingActive) return;

      try {
        const res = await fetch(`/api/session-data?sessionId=${sessionId}`, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          const preview = (await res.text()).slice(0, 80);
          throw new Error(`Expected JSON, got "${ct}". Preview: ${preview}`);
        }
        const json = await res.json();

        if (!json) return;

        if (json.revenue && json.revenue !== formData.revenue) {
          console.log('[Polling] revenue updated:', json.revenue);
          setFormData((prev: FormFields) => ({ ...prev, revenue: json.revenue }));
        }
        if (json.countries && json.countries !== formData.countries) {
          console.log('[Polling] countries updated:', json.countries);
          setFormData((prev: FormFields) => ({ ...prev, countries: json.countries }));
        }

        // Stop polling if all data is fetched
        if (json.revenue && json.countries) {
          setOCRReady(true);
          pollingActive = false;
          clearInterval(interval);
        }
      } catch (err) {
        console.warn('[Polling] session-data fetch failed:', err);
        setError("We're having trouble syncing. Retrying now…");
      }
    }, 3000);

    return () => {
      pollingActive = false;
      clearInterval(interval);
    };
  }, [sessionId, OCRReady]);

  const resetFormData = () => {
    setFormData({ revenue: DefaultMockData.revenue, countries: DefaultMockData.countries });
  };

  const handleSetScreen = (newScreen: 'manual' | 'ocr' | 'initial') => {
    setScreen(newScreen);
    if (newScreen === 'ocr') {
      setOCRReady(false);
    }
    if (newScreen === 'manual') {
      resetFormData();
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
          <Camera onCapture={handleFile} OCRReady={OCRReady} fileAdded={fileAdded} error={error} />
        </>
      ) : (
        <>
          {screen === 'initial' ? (
            <>
              <WelcomeScreen setScreen={handleSetScreen} />
            </>
          ) : screen === 'manual' ? (
            <>
              <Explorer formData={formData} setFormData={setFormData} blend={blend} setBlend={setBlend} optLevel={optLevel} setOptLevel={setOptLevel} />
            </>
          ) : (
            <>
              {!OCRReady ? (
                <>
                  <TaxForm title={'haven'} formData={formData} setFormData={setFormData} handleBack={handleSetScreen} sessionId={sessionId} />
                </>
              ) : (
                <>
                  <Explorer formData={formData} setFormData={setFormData} blend={blend} setBlend={setBlend} optLevel={optLevel} setOptLevel={setOptLevel} />
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
