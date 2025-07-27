import React from 'react';
import formStyles from '../css/Form.module.css';
import cameraStyles from '../css/Camera.module.css';
import commonStyles from '../css/Common.module.css';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  OCRReady: boolean;
}

function Camera({ onCapture, OCRReady }: CameraProps) {
  return (
    <div className={cameraStyles.cameraContainer}>
      <div className={cameraStyles.overlay}>
        {!OCRReady ? (
          <div className={cameraStyles.cameraInstructions}>
            <h2 className={commonStyles.header}>Take a Picture</h2>
            <p className={commonStyles.description}>Capture your tax form using your device's camera.</p>
            <input type="file" accept="image/*" capture="environment" onChange={onCapture} />
          </div>
        ) : (
          <div className={cameraStyles.cameraInstructions}>
            <h2 className={commonStyles.header}>Success!</h2>
            <p className={commonStyles.description}>You may return to your browser.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Camera;
