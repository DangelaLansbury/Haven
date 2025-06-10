import React from 'react';
import formStyles from '../css/Form.module.css';
import cameraStyles from '../css/Camera.module.css';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
}

function Camera({ onCapture }: CameraProps) {
  return (
    <div className={cameraStyles.cameraContainer}>
      <div className={cameraStyles.overlay}>
        <h2 className={formStyles.formHeader}>Upload & OCR</h2>
        <input type="file" accept="image/*" capture="environment" onChange={onCapture} />
      </div>
    </div>
  );
}

export default Camera;
