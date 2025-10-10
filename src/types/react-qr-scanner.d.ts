declare module 'react-qr-scanner' {
  import { Component } from 'react';

  interface QrScannerProps {
    delay?: number;
    onError?: (error: any) => void;
    onScan?: (data: string) => void;
    style?: React.CSSProperties;
    className?: string;
    // Note: constraints prop is not supported by react-qr-scanner
  }

  export default class QrScanner extends Component<QrScannerProps> {}
}
