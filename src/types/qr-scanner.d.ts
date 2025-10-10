declare module 'qr-scanner' {
  interface QrScannerOptions {
    highlightScanRegion?: boolean;
    highlightCodeOutline?: boolean;
    preferredCamera?: string;
    maxScansPerSecond?: number;
    calculateScanRegion?: (video: HTMLVideoElement) => { x: number; y: number; width: number; height: number };
    onDecodeError?: (error: Error) => void;
  }

  interface QrScannerResult {
    data: string;
    cornerPoints: Array<{ x: number; y: number }>;
  }

  class QrScanner {
    constructor(
      video: HTMLVideoElement,
      onDecode: (result: QrScannerResult) => void,
      options?: QrScannerOptions
    );
    
    start(): Promise<void>;
    stop(): Promise<void>;
    destroy(): void;
    static hasCamera(): Promise<boolean>;
    static listCameras(): Promise<Array<{ id: string; label: string }>>;
  }

  export default QrScanner;
}
