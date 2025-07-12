import React from 'react';
import formStyles from '../css/Form.module.css';
import cameraStyles from '../css/Camera.module.css';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  OCRReady: boolean;
  setOCRReady: (ready: boolean) => void;
}

function Camera({ onCapture, OCRReady, setOCRReady }: CameraProps) {
  return (
    <div className={cameraStyles.cameraContainer}>
      <div className={cameraStyles.overlay}>
        {!OCRReady ? (
          <>
            <h2 className={formStyles.formHeader}>Take a Picture</h2>
            <p className={formStyles.formDescription}>Capture your tax form using your device's camera.</p>
            <input type="file" accept="image/*" capture="environment" onChange={onCapture} />
          </>
        ) : (
          <>
            <h2 className={formStyles.formHeader}>Picture Taken</h2>
            <button onClick={setOCRReady}>Take again</button>
          </>
        )}
      </div>
    </div>
  );
}

export default Camera;
