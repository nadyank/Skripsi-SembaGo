import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  fps?: number;
  qrbox?: number;
}

export default function Scanner({ onScan, fps = 10, qrbox = 250 }: ScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // delay setup to ensure container is ready
    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps, qrbox, rememberLastUsedCamera: true },
        /* verbose= */ false
      );

      scannerRef.current = scanner;

      scanner.render((decodedText) => {
        onScan(decodedText);
      }, (error) => {
        // error handled silently as scan is continuous
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Scanner clear error", err));
      }
    };
  }, [onScan, fps, qrbox]);

  return (
    <div className="w-full max-w-md mx-auto overflow-hidden rounded-xl border-4 border-maroon bg-white shadow-xl">
      <div id="reader" className="w-full"></div>
      <div className="p-4 bg-maroon text-white text-center text-sm font-medium">
        Scan Barcode Barang
      </div>
    </div>
  );
}
