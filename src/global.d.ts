/// <reference types="vite/client" />

declare module '*.module.css';

declare module 'versor' {
  type Rotation = [number, number, number];
  type Cartesian = [number, number, number];
  type Quaternion = [number, number, number, number];

  interface Versor {
    (rotation: Rotation): Quaternion;
    cartesian(coordinates: [number, number]): Cartesian;
    delta(from: Cartesian, to: Cartesian, alpha?: number): Quaternion;
    multiply(first: Quaternion, second: Quaternion): Quaternion;
    rotation(quaternion: Quaternion): Rotation;
  }

  const versor: Versor;
  export default versor;
}
